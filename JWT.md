Located in `data.get('config').user_jwt` is a JSON Web Token that contains a
signed copy of everything in `data.get('config').user`. You can use this to
send authenticated requests to backend services.

To validate this JWT use the following keys with the `RS256` algorithm:

# Production public key
```
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAw2anizgphDOiYYO36A+C
RYV7FD1bthednWPavfWN+vaOvpN7WWc1nNnMnWL5AwuX1bKltrJsQux3jK+9iz1k
SU7mUUO8NSm6KeUzfC29jGQ8m5Q3AJSrmjKYlA8qodsCvWaEHGyttGG+qQ4bcLlV
Y1FArUGaYfvjUfAsvrtXLW6arN00FwYyQsy2AfHUbk4qf0XV7HgznlqzwCGkRGwW
gvDk7sRsbEAtKbrtb+4pvSEcjZCGZLKrPyJZDROQqi+yFjyCkXpZcnD7qH8uOC8Z
nr41047vsUuiFMZMyc7DCY2gPirJfQwZceWx4aYG1IIvxpz/NSgrNhtfJtdM3DOm
Dwl31RvNPiS5sUVFR3bc5B95GkUCpRZVvhU5eupQ+b48Agh40V4UDC2yzmh5kgZq
+95rLXZValr1yz1vHwohfSoOQcvt4uOS63T+dcfas3QGFseNzv3yyDUZF4OS8MMv
66eUBHwfJS7WKn7Q7pVNPtbRMVaqnTc2Izix1rgayoRLVrmcmoXo48xBKyvtAyQE
KwKZqaS3IoAtVByJGWI0V7NS+yo3czY1AeJPQKsZwYcJO6GGH0xSca2oEXHhgEUs
VOx+lVoY8+8bHWP7wF7zwEtm1LS24846fk9EZxGLizbgu8vUm2p6p4cBkKpc9plG
DFyihh1KUkUUdHC0xGrbFvkCAwEAAQ==
-----END PUBLIC KEY-----
```


# Beta public key
```
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAsXuQUWuubpd5KDdj88ri
7RNCwf+lUHitojq3RtdyMoyBvlkZbmvNaJxOvMP8+n+JTx3txhtZMOZmNo9PgAWS
U5IH4eOu1Wr3JXACtk6AmHuQtsIvPNoW1x2hNmCqqLMIf5Rww5ZiIIGck1yhE97q
yKWMKbaK2beVJD2T0tFfBowb8d/5NUhwEmHYkTeQtx/LGjZ+4ia3QKtcCnfc1RmP
rAiGJmocYdiMmIwM/w7/k9XoCjvnGrCE0XGEskHGbUK5UMi+Aet3z3euhT907zdf
nyFQaIRfUbr+tmgJjni07PLCV65NhVdHnsCTcPjou/j9lhKmWAP1PtdXZcBNfw05
+SFKMYyyiSXQ4azMItoBB9Ef6s+q0R+GYQ9ibF/8xufIKmwU71YudiYz134hkF5i
SKxoSTisEu6tHJIxt4QcmBEd/Jwo0u5hwsUX9os7w92JBvnsU3kcpaPWCLNoHiZC
AN/Hmj9ITkvqflweazI5HKZQ5mF7qCf4kn2CDl9usNI+0GtI7hfSTFI+kO/epPMi
5n9oDbrPNr5yfrTzdVEapDYI7rGKkiH5o2zr8agGIfj4RpBYTY5I1ETStl8gm74A
jnoJ1J173YV+kRof2kbazQ5cAxzBgKEbdlIpYUx/BSsCM09PAGu5VXepAeQxhCKW
hX/BhnJyrCVQRtJyK3vXeFUCAwEAAQ==
-----END PUBLIC KEY-----
```
