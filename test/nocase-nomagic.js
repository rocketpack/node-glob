var fs = require('graceful-fs');
var test = require('tap').test;
var glob = require('../');
var libpath = require('path');

var win32Drive = process.cwd();
while (win32Drive !== libpath.dirname(win32Drive)) {
  win32Drive = libpath.dirname(win32Drive);
}

test('mock fs', function(t) {
  var stat = fs.stat
  var statSync = fs.statSync
  var readdir = fs.readdir
  var readdirSync = fs.readdirSync

  function fakeStat(path) {
    var ret,
        win32TmpDir = libpath.join(win32Drive, 'tmp').toLowerCase(),
        win32ADir = libpath.join(win32Drive, 'tmp/a').toLowerCase();
    path = path.toLowerCase();
    switch (path) {
      case '/tmp': case '/tmp/': case win32TmpDir: case win32TmpDir + '\\':
        ret = { isDirectory: function() { return true } }
        break
      case '/tmp/a': case win32ADir:
        ret = { isDirectory: function() { return false } }
        break
    }
    return ret
  }

  fs.stat = function(path, cb) {
    var f = fakeStat(path);
    if (f) {
      process.nextTick(function() {
        cb(null, f)
      })
    } else {
      stat.call(fs, path, cb)
    }
  }

  fs.statSync = function(path) {
    return fakeStat(path) || statSync.call(fs, path)
  }

  function fakeReaddir(path) {
    var ret,
        win32TmpDir = libpath.join(win32Drive, 'tmp').toLowerCase();
    path = path.toLowerCase();
    switch (path) {
      case '/tmp': case '/tmp/': case win32TmpDir: case win32TmpDir + '\\':
        ret = [ 'a', 'A' ]
        break
      case '/': case win32Drive.toLowerCase():
        ret = ['tmp', 'tMp', 'tMP', 'TMP']
    }
    return ret
  }

  fs.readdir = function(path, cb) {
    var f = fakeReaddir(path)
    if (f)
      process.nextTick(function() {
        cb(null, f)
      })
    else
      readdir.call(fs, path, cb)
  }

  fs.readdirSync = function(path) {
    return fakeReaddir(path) || readdirSync.call(fs, path)
  }

  t.pass('mocked')
  t.end()
})

test('nocase, nomagic', function(t) {
  var n = 2
  var want = [ '/TMP/A',
               '/TMP/a',
               '/tMP/A',
               '/tMP/a',
               '/tMp/A',
               '/tMp/a',
               '/tmp/A',
               '/tmp/a' ]

  if(process.platform.match(/^win/)) {
    want = want.map(function(p) {
      var normPath = libpath.join(win32Drive, p);
      return normPath.replace(/\\/g, '/');
    })
  }
  glob('/tmp/a', { nocase: true }, function(er, res) {
    if (er)
      throw er
    t.same(res.sort(), want)
    if (--n === 0) t.end()
  })
  glob('/tmp/A', { nocase: true }, function(er, res) {
    if (er)
      throw er
    t.same(res.sort(), want)
    if (--n === 0) t.end()
  })
})

test('nocase, with some magic', function(t) {
  t.plan(2)
  var want = [ '/TMP/A',
               '/TMP/a',
               '/tMP/A',
               '/tMP/a',
               '/tMp/A',
               '/tMp/a',
               '/tmp/A',
               '/tmp/a' ]
  if(process.platform.match(/^win/)) {
    want = want.map(function(p) {
      var normPath = libpath.join(win32Drive, p);
      return normPath.replace(/\\/g, '/');
    })
  }

  glob('/tmp/*', { nocase: true }, function(er, res) {
    if (er)
      throw er
    t.same(res.sort(), want)
  })
  glob('/tmp/*', { nocase: true }, function(er, res) {
    if (er)
      throw er
    t.same(res.sort(), want)
  })
})
