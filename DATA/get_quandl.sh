#!/bin/bash
api_key=-yidvxe1XqCkT8wu1yvv
declare -a stock_codes[suscript]
#stock_codes=(("6482") "6294" "4902" "9305" "3687" "3646" "6727")
stock_codes=([6482]=6482 [6294]=6294 [4902]=4902 [9305]=9305 [3687]=3687 [3646]=3646 [6727]=6727)
base_url="https://www.quandl.com/api/v3/datasets/TSE/"
post_fix=".csv?api_key="$api_key
extension=.csv
for code in ${stock_codes[@]}; do
    url=$base_url$code$post_fix
    wget $url -O $code$extension
done
