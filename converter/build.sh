#!/bin/bash

cd $(dirname $0)

cat main.html | awk '/<\/head>/ {
	tab="        ";
	print tab"<style type='text/css'>";
	system("scss --sourcemap=none --compass --style compressed main.scss");
	print tab"</style>"
} {print $0}'
