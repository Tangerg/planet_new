package scan

import (
	"bytes"
	"encoding/binary"
	"os"
	"path/filepath"
	"testing"
)

// makeWav builds a valid PCM WAV with `dataBytes` of audio payload.
func makeWav(dataBytes int) []byte {
	const byteRate = 176400 // 44100 Hz * 2ch * 16-bit
	var b bytes.Buffer
	b.WriteString("RIFF")
	binary.Write(&b, binary.LittleEndian, uint32(36+dataBytes))
	b.WriteString("WAVE")
	b.WriteString("fmt ")
	binary.Write(&b, binary.LittleEndian, uint32(16))
	binary.Write(&b, binary.LittleEndian, uint16(1))
	binary.Write(&b, binary.LittleEndian, uint16(2))
	binary.Write(&b, binary.LittleEndian, uint32(44100))
	binary.Write(&b, binary.LittleEndian, uint32(byteRate))
	binary.Write(&b, binary.LittleEndian, uint16(4))
	binary.Write(&b, binary.LittleEndian, uint16(16))
	b.WriteString("data")
	binary.Write(&b, binary.LittleEndian, uint32(dataBytes))
	b.Write(make([]byte, dataBytes))
	return b.Bytes()
}

func writeTemp(t *testing.T, name string, data []byte) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), name)
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestWavDuration(t *testing.T) {
	const byteRate = 176400
	if got := probeDuration(writeTemp(t, "a.wav", makeWav(byteRate*2))).Millis(); got != 2000 {
		t.Fatalf("wav duration = %d ms, want 2000", got)
	}
}

func TestFlacDuration(t *testing.T) {
	const sampleRate = 44100
	const totalSamples = sampleRate * 3
	v := uint64(sampleRate)<<44 | uint64(totalSamples)

	var b bytes.Buffer
	b.WriteString("fLaC")
	b.Write([]byte{0x00, 0x00, 0x00, 0x22}) // STREAMINFO header, length 34
	b.Write(make([]byte, 10))               // block + frame sizes
	binary.Write(&b, binary.BigEndian, v)   // sampleRate + channels + bps + totalSamples
	b.Write(make([]byte, 16))               // MD5

	if got := probeDuration(writeTemp(t, "a.flac", b.Bytes())).Millis(); got != 3000 {
		t.Fatalf("flac duration = %d ms, want 3000", got)
	}
}

func TestMp3XingDuration(t *testing.T) {
	const frames = 1000
	const want = frames * 1152 * 1000 / 44100 // 26122 ms

	var b bytes.Buffer
	b.Write([]byte{0xFF, 0xFB, 0x90, 0x00}) // MPEG1 L3, 128kbps, 44100Hz, stereo
	b.Write(make([]byte, 32))               // pad to the MPEG1-stereo Xing offset (36)
	b.WriteString("Xing")
	binary.Write(&b, binary.BigEndian, uint32(0x1)) // flags: frames field present
	binary.Write(&b, binary.BigEndian, uint32(frames))

	if got := probeDuration(writeTemp(t, "a.mp3", b.Bytes())).Millis(); got != want {
		t.Fatalf("mp3 duration = %d ms, want %d", got, want)
	}
}

func TestUnknownFormatDurationIsZero(t *testing.T) {
	if got := probeDuration(writeTemp(t, "a.ogg", []byte("not really ogg"))).Millis(); got != 0 {
		t.Fatalf("unknown format duration = %d, want 0", got)
	}
}
