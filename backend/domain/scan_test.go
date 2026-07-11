package domain

import "testing"

func TestScanSnapshotPruneAuthorityDefaultsToSafe(t *testing.T) {
	if (ScanSnapshot{}).AllowsPrune() {
		t.Fatal("zero-value scan snapshot must not allow pruning")
	}
	if (ScanSnapshot{Completeness: ScanPartial}).AllowsPrune() {
		t.Fatal("partial scan snapshot must not allow pruning")
	}
	if !(ScanSnapshot{Completeness: ScanComplete}).AllowsPrune() {
		t.Fatal("complete scan snapshot should allow pruning")
	}
}
