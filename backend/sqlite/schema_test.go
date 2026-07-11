package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"path/filepath"
	"testing"
)

func openRaw(t *testing.T, path string) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", "file:"+path+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(0)")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return db
}

func schemaVersion(t *testing.T, db *sql.DB) int {
	t.Helper()
	var version int
	if err := db.QueryRowContext(context.Background(), `PRAGMA user_version`).Scan(&version); err != nil {
		t.Fatal(err)
	}
	return version
}

func TestFreshDatabaseMigratesToCurrentVersion(t *testing.T) {
	c := newTestCatalog(t)
	if got := schemaVersion(t, c.db); got != currentSchemaVersion {
		t.Fatalf("schema version = %d, want %d", got, currentSchemaVersion)
	}
}

func TestVersionOneDatabaseUpgradesWithoutLosingDataAndReopensIdempotently(t *testing.T) {
	path := filepath.Join(t.TempDir(), "legacy.db")
	db := openRaw(t, path)
	if _, err := db.ExecContext(testContext, schemaV1); err != nil {
		t.Fatal(err)
	}
	if _, err := db.ExecContext(testContext, `INSERT INTO artists(id, name) VALUES('artist', 'Legacy Artist')`); err != nil {
		t.Fatal(err)
	}
	if _, err := db.ExecContext(testContext, `PRAGMA user_version = 1`); err != nil {
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}

	catalog, err := Open(testContext, path)
	if err != nil {
		t.Fatal(err)
	}
	artists, err := catalog.Artists(testContext)
	if err != nil || len(artists) != 1 || artists[0].Name != "Legacy Artist" {
		t.Fatalf("artists after upgrade = %+v, %v", artists, err)
	}
	if got := schemaVersion(t, catalog.db); got != currentSchemaVersion {
		t.Fatalf("upgraded schema version = %d, want %d", got, currentSchemaVersion)
	}
	if err := catalog.Close(); err != nil {
		t.Fatal(err)
	}

	reopened, err := Open(testContext, path)
	if err != nil {
		t.Fatalf("idempotent reopen failed: %v", err)
	}
	defer reopened.Close()
	if got := schemaVersion(t, reopened.db); got != currentSchemaVersion {
		t.Fatalf("reopened schema version = %d, want %d", got, currentSchemaVersion)
	}
}

func TestUnversionedLegacySchemaIsAdoptedAndValidated(t *testing.T) {
	path := filepath.Join(t.TempDir(), "unversioned.db")
	db := openRaw(t, path)
	if _, err := db.ExecContext(testContext, schemaV1+schemaV2); err != nil {
		t.Fatal(err)
	}
	if _, err := db.ExecContext(testContext, `INSERT INTO artists(id, name) VALUES('legacy', 'Unversioned')`); err != nil {
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}

	catalog, err := Open(testContext, path)
	if err != nil {
		t.Fatal(err)
	}
	defer catalog.Close()
	if got := schemaVersion(t, catalog.db); got != currentSchemaVersion {
		t.Fatalf("adopted schema version = %d, want %d", got, currentSchemaVersion)
	}
	artists, err := catalog.Artists(testContext)
	if err != nil || len(artists) != 1 || artists[0].ID != "legacy" {
		t.Fatalf("legacy data after adoption = %+v, %v", artists, err)
	}
}

func TestDatabaseFromNewerApplicationIsRejected(t *testing.T) {
	path := filepath.Join(t.TempDir(), "future.db")
	db := openRaw(t, path)
	if _, err := db.ExecContext(testContext, `PRAGMA user_version = 99`); err != nil {
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}

	catalog, err := Open(testContext, path)
	if catalog != nil || !errors.Is(err, ErrSchemaTooNew) {
		t.Fatalf("Open future schema = (%v, %v), want nil/ErrSchemaTooNew", catalog, err)
	}
	check := openRaw(t, path)
	if got := schemaVersion(t, check); got != 99 {
		t.Fatalf("rejected schema version changed to %d", got)
	}
}

func TestFailedMigrationRollsBackDDLAndVersion(t *testing.T) {
	path := filepath.Join(t.TempDir(), "rollback.db")
	db := openRaw(t, path)
	err := applyMigrations(testContext, db, []migration{{
		version: 1,
		sql:     `CREATE TABLE should_rollback(id INTEGER); THIS IS NOT SQL;`,
	}}, nil)
	if err == nil {
		t.Fatal("invalid migration unexpectedly succeeded")
	}
	if got := schemaVersion(t, db); got != 0 {
		t.Fatalf("version after rollback = %d, want 0", got)
	}
	var count int
	if err := db.QueryRowContext(testContext, `SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='should_rollback'`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 0 {
		t.Fatal("failed migration left its table behind")
	}
}

func TestCurrentVersionWithIncompatibleShapeFailsValidation(t *testing.T) {
	path := filepath.Join(t.TempDir(), "invalid.db")
	db := openRaw(t, path)
	if _, err := db.ExecContext(testContext, `CREATE TABLE artists(id TEXT PRIMARY KEY); PRAGMA user_version = 2;`); err != nil {
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}

	catalog, err := Open(testContext, path)
	if catalog != nil || err == nil {
		t.Fatalf("Open incompatible current schema = (%v, %v), want validation failure", catalog, err)
	}
}
