Control Ascoltatori
===========

__Control Ascoltatori__ is an overlay library built on the top of the Ascoltatori library ( https://github.com/mcollina/ascoltatori ).

This library provides a set of Ascoltatori of higher lever that wrap a basic Ascoltatore to improve its abilities.

## Usage

It replicates the usage of the ascoltatori library. The only difference is the creation of a new
event called 'nodeDeath' so you can attach a function to heartbeatAscoltatore.on('nodeDeath', function(){...}) and
you will receive an object like: {channel: channel, id : id} with the infos of the node that cannot be reached anymore.

If you feel one more option is missing, feel free to fork this library,
add it, and then send a pull request.

## Development

The library is currently under develop and is currently only available the heartbeat ascoltatore. If you are interested on the project,
feel free to send pull requests and contact the developers.

## Install

This library is not currently on npm. When it will, you would install it with:

```
npm install control-ascoltatori
```

## LICENSE - "MIT License"

Copyright (c) 2012-2013 Filippo De Pretto, http://www.filnik.com

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
