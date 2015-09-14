#!/bin/bash

cat converter/main.html | awk '/<\/head>/ {
	tab="        ";
	print tab"<style type='text/css'>";
	system("scss --sourcemap=none --compass --style compressed converter/main.scss");
	print tab"</style>"
} {print $0}'
