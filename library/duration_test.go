package library

import (
	"bytes"
	"encoding/binary"
	"os"
	"path/filepath"
	"testing"
)

func writeTemp(t *testing.T, name string, data []byte) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), name)
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

// A minimal WAV with a known byteRate + data size → duration = data/byteRate.
func TestWavDuration(t *testing.T) {
	const byteRate = 176400 // 44100 Hz * 2ch * 16-bit
	var b bytes.Buffer
	b.WriteString("RIFF")
	binary.Write(&b, binary.LittleEndian, uint32(0)) // riff size (unused by parser)
	b.WriteString("WAVE")
	b.WriteString("fmt ")
	binary.Write(&b, binary.LittleEndian, uint32(16))
	binary.Write(&b, binary.LittleEndian, uint16(1))        // PCM
	binary.Write(&b, binary.LittleEndian, uint16(2))        // channels
	binary.Write(&b, binary.LittleEndian, uint32(44100))    // sample rate
	binary.Write(&b, binary.LittleEndian, uint32(byteRate)) // byte rate
	binary.Write(&b, binary.LittleEndian, uint16(4))        // block align
	binary.Write(&b, binary.LittleEndian, uint16(16))       // bits/sample
	b.WriteString("data")
	binary.Write(&b, binary.LittleEndian, uint32(byteRate*2)) // 2 seconds

	got := probeDurationMs(writeTemp(t, "a.wav", b.Bytes()))
	if got != 2000 {
		t.Fatalf("wav duration = %d ms, want 2000", got)
	}
}

// A minimal FLAC: fLaC + STREAMINFO whose trailing 64-bit window packs sample
// rate (top 20 bits) and total samples (low 36 bits).
func TestFlacDuration(t *testing.T) {
	const sampleRate = 44100
	const totalSamples = sampleRate * 3 // 3 seconds
	v := uint64(sampleRate)<<44 | uint64(totalSamples)

	var b bytes.Buffer
	b.WriteString("fLaC")
	b.Write([]byte{0x00, 0x00, 0x00, 0x22}) // STREAMINFO block header, length 34
	b.Write(make([]byte, 10))               // min/max block + frame sizes
	binary.Write(&b, binary.BigEndian, v)   // sampleRate + channels + bps + totalSamples
	b.Write(make([]byte, 16))               // MD5

	got := probeDurationMs(writeTemp(t, "a.flac", b.Bytes()))
	if got != 3000 {
		t.Fatalf("flac duration = %d ms, want 3000", got)
	}
}

// A minimal MPEG-1 Layer-3 frame with a Xing header carrying an exact frame
// count → duration = frames * 1152 / sampleRate.
func TestMp3XingDuration(t *testing.T) {
	const frames = 1000
	const want = frames * 1152 * 1000 / 44100 // 26122 ms

	var b bytes.Buffer
	b.Write([]byte{0xFF, 0xFB, 0x90, 0x00}) // MPEG1 L3, 128kbps, 44100Hz, stereo
	b.Write(make([]byte, 32))               // pad to the MPEG1-stereo Xing offset (36)
	b.WriteString("Xing")
	binary.Write(&b, binary.BigEndian, uint32(0x1)) // flags: frames field present
	binary.Write(&b, binary.BigEndian, uint32(frames))

	got := probeDurationMs(writeTemp(t, "a.mp3", b.Bytes()))
	if got != want {
		t.Fatalf("mp3 duration = %d ms, want %d", got, want)
	}
}

func TestUnknownFormatDurationIsZero(t *testing.T) {
	if got := probeDurationMs(writeTemp(t, "a.ogg", []byte("not really ogg"))); got != 0 {
		t.Fatalf("unknown format duration = %d, want 0 (renders as --:--)", got)
	}
}
