package scan

import (
	"encoding/binary"
	"io"
	"os"
	"path/filepath"
	"strings"

	"changeme/library/domain"
)

// probeDuration returns an audio file's playback length, best-effort. dhowden/tag
// reads tags but not stream length, so we parse the container ourselves for the
// common desktop formats (MP3, FLAC, WAV). Unknown or unparseable formats return
// zero — the UI renders that as "--:--" rather than a wrong number, and the
// <audio> element still reports the true length on play.
func probeDuration(path string) domain.Duration {
	f, err := os.Open(path)
	if err != nil {
		return 0
	}
	defer f.Close()

	switch strings.ToLower(filepath.Ext(path)) {
	case ".flac":
		return domain.Duration(flacMillis(f))
	case ".wav":
		return domain.Duration(wavMillis(f))
	case ".mp3":
		return domain.Duration(mp3Millis(f))
	default:
		return 0
	}
}

// ── FLAC ─────────────────────────────────────────────────────────────────────
// STREAMINFO's trailing 64 bits pack sampleRate (20) + channels (3) +
// bitsPerSample (5) + totalSamples (36).

func flacMillis(f *os.File) int {
	var magic [4]byte
	if _, err := io.ReadFull(f, magic[:]); err != nil || string(magic[:]) != "fLaC" {
		return 0
	}
	var buf [8]byte // sampleRate + totalSamples window, 10 bytes into the body
	if _, err := f.ReadAt(buf[:], 18); err != nil {
		return 0
	}
	v := binary.BigEndian.Uint64(buf[:])
	sampleRate := v >> 44
	totalSamples := v & 0xFFFFFFFFF
	if sampleRate == 0 || totalSamples == 0 {
		return 0
	}
	return int(totalSamples * 1000 / sampleRate)
}

// ── WAV ──────────────────────────────────────────────────────────────────────
// duration = data-chunk bytes / byteRate.

func wavMillis(f *os.File) int {
	var riff [12]byte
	if _, err := io.ReadFull(f, riff[:]); err != nil {
		return 0
	}
	if string(riff[0:4]) != "RIFF" || string(riff[8:12]) != "WAVE" {
		return 0
	}
	var byteRate uint32
	var hdr [8]byte
	for {
		if _, err := io.ReadFull(f, hdr[:]); err != nil {
			return 0
		}
		id := string(hdr[0:4])
		size := binary.LittleEndian.Uint32(hdr[4:8])
		switch id {
		case "fmt ":
			body := make([]byte, size)
			if _, err := io.ReadFull(f, body); err != nil {
				return 0
			}
			if len(body) >= 12 {
				byteRate = binary.LittleEndian.Uint32(body[8:12])
			}
		case "data":
			if byteRate == 0 {
				return 0
			}
			return int(uint64(size) * 1000 / uint64(byteRate))
		default:
			if _, err := f.Seek(int64(size), io.SeekCurrent); err != nil {
				return 0
			}
		}
	}
}

// ── MP3 ──────────────────────────────────────────────────────────────────────
// Prefer the Xing/Info VBR header (exact frame count); fall back to a CBR
// estimate from the first frame's bitrate.

var mp3BitrateKbps = map[int][16]int{
	13: {0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0}, // MPEG1 Layer3
	23: {0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0},     // MPEG2/2.5 Layer3
}

var mp3SampleRates = map[int][4]int{
	3: {44100, 48000, 32000, 0}, // MPEG1
	2: {22050, 24000, 16000, 0}, // MPEG2
	0: {11025, 12000, 8000, 0},  // MPEG2.5
}

func mp3Millis(f *os.File) int {
	var start int64
	var id3 [10]byte
	if _, err := io.ReadFull(f, id3[:]); err == nil && string(id3[0:3]) == "ID3" {
		// Skip an ID3v2 tag: 10-byte header + syncsafe (7-bit) size.
		size := int64(id3[6]&0x7f)<<21 | int64(id3[7]&0x7f)<<14 | int64(id3[8]&0x7f)<<7 | int64(id3[9]&0x7f)
		start = 10 + size
	}

	var h [4]byte
	if _, err := f.ReadAt(h[:], start); err != nil {
		return 0
	}
	if h[0] != 0xFF || h[1]&0xE0 != 0xE0 {
		return 0
	}
	versionBits := int(h[1]>>3) & 3 // 3=MPEG1, 2=MPEG2, 0=MPEG2.5
	layerBits := int(h[1]>>1) & 3   // 1=Layer3
	if layerBits != 1 {
		return 0
	}
	bitrateIdx := int(h[2]>>4) & 0xF
	sampleRateIdx := int(h[2]>>2) & 3

	rates, ok := mp3SampleRates[versionBits]
	if !ok {
		return 0
	}
	sampleRate := rates[sampleRateIdx]
	if sampleRate == 0 {
		return 0
	}
	brTable := mp3BitrateKbps[13]
	if versionBits != 3 {
		brTable = mp3BitrateKbps[23]
	}
	bitrate := brTable[bitrateIdx] * 1000

	samplesPerFrame := 1152
	if versionBits != 3 {
		samplesPerFrame = 576
	}

	channelMode := int(h[3]>>6) & 3 // 3 = mono
	var xingOffset int64
	switch {
	case versionBits == 3 && channelMode == 3:
		xingOffset = 21
	case versionBits == 3:
		xingOffset = 36
	case channelMode == 3:
		xingOffset = 13
	default:
		xingOffset = 21
	}

	var tag [8]byte
	if _, err := f.ReadAt(tag[:], start+xingOffset); err == nil {
		if id := string(tag[0:4]); id == "Xing" || id == "Info" {
			if binary.BigEndian.Uint32(tag[4:8])&0x1 != 0 { // frames field present
				var fb [4]byte
				if _, err := f.ReadAt(fb[:], start+xingOffset+8); err == nil {
					if frames := binary.BigEndian.Uint32(fb[:]); frames > 0 {
						return int(uint64(frames) * uint64(samplesPerFrame) * 1000 / uint64(sampleRate))
					}
				}
			}
		}
	}

	if bitrate == 0 {
		return 0
	}
	stat, err := f.Stat()
	if err != nil {
		return 0
	}
	audioBytes := stat.Size() - start
	if audioBytes <= 0 {
		return 0
	}
	return int(audioBytes * 8 * 1000 / int64(bitrate))
}
