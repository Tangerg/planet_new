package library

import (
	"encoding/binary"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// probeDurationMs returns the playback length of an audio file in milliseconds,
// best-effort. `dhowden/tag` reads tags but not stream length, so we parse the
// container ourselves for the common desktop formats (MP3, FLAC, WAV). Unknown
// or unparseable formats return 0 — the UI renders that as "--:--" rather than a
// wrong number, and the <audio> element still reports the true length on play.
func probeDurationMs(path string) int {
	f, err := os.Open(path)
	if err != nil {
		return 0
	}
	defer f.Close()

	switch strings.ToLower(filepath.Ext(path)) {
	case ".flac":
		return flacDurationMs(f)
	case ".wav":
		return wavDurationMs(f)
	case ".mp3":
		return mp3DurationMs(f)
	default:
		return 0
	}
}

// ── FLAC ─────────────────────────────────────────────────────────────────────
// STREAMINFO is the first metadata block; its trailing 64 bits pack sampleRate
// (20) + channels (3) + bitsPerSample (5) + totalSamples (36).

func flacDurationMs(f *os.File) int {
	var magic [4]byte
	if _, err := io.ReadFull(f, magic[:]); err != nil || string(magic[:]) != "fLaC" {
		return 0
	}
	// STREAMINFO body starts after the 4-byte block header; the sampleRate +
	// totalSamples window sits 10 bytes into the body (file offset 4+4+10 = 18).
	var buf [8]byte
	if _, err := f.ReadAt(buf[:], 18); err != nil {
		return 0
	}
	v := binary.BigEndian.Uint64(buf[:])
	sampleRate := v >> 44
	totalSamples := v & 0xFFFFFFFFF // low 36 bits
	if sampleRate == 0 || totalSamples == 0 {
		return 0
	}
	return int(totalSamples * 1000 / sampleRate)
}

// ── WAV ──────────────────────────────────────────────────────────────────────
// duration = data-chunk bytes / byteRate (from the fmt chunk).

func wavDurationMs(f *os.File) int {
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
	// MPEG1 Layer3
	13: {0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0},
	// MPEG2/2.5 Layer3
	23: {0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0},
}

var mp3SampleRates = map[int][4]int{
	3: {44100, 48000, 32000, 0}, // MPEG1
	2: {22050, 24000, 16000, 0}, // MPEG2
	0: {11025, 12000, 8000, 0},  // MPEG2.5
}

func mp3DurationMs(f *os.File) int {
	// Skip an ID3v2 tag if present (10-byte header + syncsafe size).
	var start int64
	var id3 [10]byte
	if _, err := io.ReadFull(f, id3[:]); err == nil && string(id3[0:3]) == "ID3" {
		size := int64(id3[6]&0x7f)<<21 | int64(id3[7]&0x7f)<<14 | int64(id3[8]&0x7f)<<7 | int64(id3[9]&0x7f)
		start = 10 + size
	}

	// Read the first frame header.
	var h [4]byte
	if _, err := f.ReadAt(h[:], start); err != nil {
		return 0
	}
	if h[0] != 0xFF || h[1]&0xE0 != 0xE0 {
		return 0 // no frame sync where expected
	}
	versionBits := int(h[1]>>3) & 3 // 3=MPEG1, 2=MPEG2, 0=MPEG2.5
	layerBits := int(h[1]>>1) & 3   // 1=Layer3
	if layerBits != 1 {
		return 0 // only Layer3 tables provided
	}
	bitrateIdx := int(h[2]>>4) & 0xF
	sampleRateIdx := int(h[2]>>2) & 3
	padding := int(h[2]>>1) & 1

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
		samplesPerFrame = 576 // MPEG2/2.5 Layer3
	}

	// Xing/Info header offset within the frame depends on version + channel mode.
	channelMode := int(h[3]>>6) & 3 // 3 = mono
	var xingOffset int64
	if versionBits == 3 { // MPEG1
		if channelMode == 3 {
			xingOffset = 21
		} else {
			xingOffset = 36
		}
	} else { // MPEG2 / 2.5
		if channelMode == 3 {
			xingOffset = 13
		} else {
			xingOffset = 21
		}
	}

	var tag [8]byte
	if _, err := f.ReadAt(tag[:], start+xingOffset); err == nil {
		id := string(tag[0:4])
		if id == "Xing" || id == "Info" {
			flags := binary.BigEndian.Uint32(tag[4:8])
			if flags&0x1 != 0 { // frames field present
				var fb [4]byte
				if _, err := f.ReadAt(fb[:], start+xingOffset+8); err == nil {
					frames := binary.BigEndian.Uint32(fb[:])
					if frames > 0 {
						return int(uint64(frames) * uint64(samplesPerFrame) * 1000 / uint64(sampleRate))
					}
				}
			}
		}
	}

	// CBR estimate from the audio-data byte length.
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
	_ = padding // frame-precise sizing not needed for the CBR estimate
	return int(audioBytes * 8 * 1000 / int64(bitrate))
}
