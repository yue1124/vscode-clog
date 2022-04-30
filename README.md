# Bigyue's Clog Support

this is **A Markdown Preview** with Front Matter for bigyue.cn

In [bigyue.cn](https://bigyue.cn), Clog is a markdown file with front matter (toml). 

In order to see how clog can appear in the bigyue.cn, I write this extension for real-time see the effect.

## Features

### Markdown Preview

when open a `.md` file, you can click `show preview` in the editor toolbar to activate real-time markdown preview.

### Show Front Matter

if markdown file start with a front matter block, such as

```
+++
title: This is a front matter
description: introduction
+++

markdown content
```

it will not be parse as an part of markdown, instead it will be shown as a code block at the top of the markdown preview.

### Auto update Front Matter on save

some information contained in front matter needs update when saving a markdown file, such as property `last_modified`.

## Release Notes

### 0.0.4

add xScrollable for code_block, add new feature (front matter auto update on save)

### 0.0.3

fix img parsing error (relative path), using `onDidChangeTextDocument` instead of `setInterval`

### 0.0.2

optimize package size, and fix img parsing error

### 0.0.1

basic version, with real-time markdown preview with front matter 

## Incoming Features

- frontmatter's modify and autosave ability
