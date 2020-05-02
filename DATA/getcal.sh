#!/bin/sh
base_url="http://www.benri.com/calendar/"
common_extension=".html"

year="2000"
while [ $year -ne 2025 ]; do
    url=$base_url$year$common_extension
    wget $url
    year=$(($year+1))
done
