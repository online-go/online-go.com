
WAV=$(wildcard *.wav) 
MP3=$(WAV:.wav=.mp3)
OGG=$(WAV:.wav=.ogg)

all: $(MP3) $(OGG)

%.mp3: %.wav Makefile
	lame -h -b 192 $< $@

%.ogg: %.wav Makefile
	oggenc $< -o $@

