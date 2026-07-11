package domain

// ScanCompleteness records whether a filesystem scan is authoritative for the
// whole requested tree. Only a complete snapshot may be used to infer that a
// previously indexed file has disappeared.
type ScanCompleteness uint8

const (
	// ScanPartial means at least one path could not be inspected. Metadata that
	// was read is still useful, but absence from this snapshot proves nothing.
	ScanPartial ScanCompleteness = iota
	// ScanComplete means every path in the requested tree was inspected.
	ScanComplete
)

// ScanSnapshot is the scanner's domain result. It carries both the metadata
// that was successfully read and the authority level of the observation.
// Completeness deliberately defaults to partial, so a zero value can never
// grant destructive prune permission by accident.
type ScanSnapshot struct {
	Metadata     []TrackMetadata
	FilesSeen    int
	Completeness ScanCompleteness
}

// AllowsPrune reports whether missing paths may be treated as deleted files.
func (s ScanSnapshot) AllowsPrune() bool { return s.Completeness == ScanComplete }
