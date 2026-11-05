package db

import (
	"bufio"
	"os"
	"toast/backend/debug"

	"github.com/elliotchance/orderedmap/v2"
)

// Close closes the store's file if it isn't already closed. Will also flush to buffer if useBuffer is true.
func (store *GDStore) Close() error {
	if debug.IS_ENABLED {
		debug.InfoLabelf("gdstore", "closing %s", debug.FormatPath(store.FilePath))
	}

	if store.file == nil {
		if debug.IS_ENABLED {
			debug.WarnLabelf("gdstore", "database is already closed")
		}
		return nil
	}

	err := store.Flush()
	if err != nil {
		if debug.IS_ENABLED {
			debug.ErrLabelf("gdstore", "failed to flush buffer on close:\n%v", err)
		}
		return err
	}

	err = store.file.Close()
	if err != nil {
		if debug.IS_ENABLED {
			debug.ErrLabelf("gdstore", "failed to close file handle:\n%v", err)
		}
		return err
	}

	store.file = nil
	store.writer = nil
	return nil
}

// Flush flushes the buffer to the file.
func (store *GDStore) Flush() error {
	if store.writer != nil {
		return store.writer.Flush()
	}
	return nil
}

// Consolidate combines all entries recorded in the file and re-saves only active entries.
// Backup creation has been removed; it directly truncates and overwrites the active file safely.
func (store *GDStore) Consolidate() error {
	store.mux.Lock()
	defer store.mux.Unlock()

	if !store.persistence {
		return nil
	}

	// Make sure active file handle is flushed and closed
	if err := store.Close(); err != nil {
		if debug.IS_ENABLED {
			debug.ErrLabelf("gdstore", "failed closing store prior to consolidation:\n%v", err)
		}
		return err
	}

	// Directly recreate/truncate the file (no .bak backup produced)
	file, err := os.OpenFile(store.FilePath, os.O_TRUNC|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		if debug.IS_ENABLED {
			debug.ErrLabelf("gdstore", "unable to truncate/create file at %s during consolidation:\n%v", debug.FormatPath(store.FilePath), err)
		}
		return err
	}

	store.file = file
	store.writer = bufio.NewWriter(file)

	// Construct the entries slice in current insertion order
	var orderedEntries []*Entry
	for _, key := range store.data.Keys() {
		val, _ := store.data.Get(key)
		orderedEntries = append(orderedEntries, newEntry(ActionPut, key, val))
	}

	if err := store.appendEntriesToFile(orderedEntries); err != nil {
		if debug.IS_ENABLED {
			debug.ErrLabelf("gdstore", "failed writing entries during consolidation:\n%v", err)
		}
		return err
	}

	return store.Flush()
}

// loadFromDisk loads the store from the disk and consolidates the entries.
func (store *GDStore) loadFromDisk() error {
	store.data = orderedmap.NewOrderedMap[string, []byte]()
	if !store.persistence {
		return nil
	}

	file, err := os.Open(store.FilePath)
	if err != nil {
		if os.IsNotExist(err) {
			file, err := os.Create(store.FilePath)
			if err != nil {
				return err
			}
			return file.Close()
		}
		return err
	}

	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := scanner.Text()
		if len(line) == 0 {
			continue // Skip blank lines gracefully
		}

		entry, err := newEntryFromLine(line)
		if err != nil {
			// FIXED: Replaced silent 'continue' with explicit line parse failure returning
			_ = file.Close()
			if debug.IS_ENABLED {
				debug.ErrLabelf("gdstore", "corrupted record on line %d:\n%v", lineNum, err)
			}
			return err
		}

		switch entry.Action {
		case ActionPut:
			store.data.Set(entry.Key, entry.Value)
		case ActionDelete:
			store.data.Delete(entry.Key)
		}
	}

	if err := scanner.Err(); err != nil {
		_ = file.Close()
		if debug.IS_ENABLED {
			debug.ErrLabelf("gdstore", "failed during scanning: %v", err)
		}
		return err
	}

	// FIXED: Explicitly handle file close error on reading completion
	if err := file.Close(); err != nil {
		if debug.IS_ENABLED {
			debug.ErrLabelf("gdstore", "failed to close file after reading disk:\n%v", err)
		}
		return err
	}

	return store.Consolidate()
}

// appendEntryToFile appends an entry to the store's file
func (store *GDStore) appendEntryToFile(entry *Entry) error {
	return store.appendEntriesToFile([]*Entry{entry})
}

// appendEntriesToFile appends a list of entries to the store's file
func (store *GDStore) appendEntriesToFile(entries []*Entry) (err error) {
	if !store.persistence {
		return nil
	}

	if store.file == nil {
		store.file, err = os.OpenFile(store.FilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return err
		}
		store.writer = bufio.NewWriter(store.file)
	}

	for _, entry := range entries {
		if store.useBuffer {
			_, err = store.writer.Write(entry.toLine())
		} else {
			_, err = store.file.Write(entry.toLine())
		}
		if err != nil {
			return err
		}
	}
	return nil
}
