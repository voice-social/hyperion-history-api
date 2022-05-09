buildNumber=$(curl -H "Authorization: Bearer $BUILDKITE_ACCESS_TOKEN" \
 https://api.buildkite.com/v2/organizations/voice-us-llc/pipelines/hyperion-explorer-plugin/builds \
 | jq '.[] | select(.branch=="DSO-394")' | jq -s '.' | jq ' .[0].number ' )

DOWNLOADURL=$(curl -H "Authorization: Bearer $BUILDKITE_ACCESS_TOKEN" \
 https://api.buildkite.com/v2/organizations/voice-us-llc/pipelines/hyperion-explorer-plugin/builds/$buildNumber/artifacts | jq -r '.[].download_url')

STORAGE=$(curl  -H "Authorization: Bearer $BUILDKITE_ACCESS_TOKEN" $DOWNLOADURL | jq -r .url)
mkdir plugins/repos
curl $STORAGE --output plugins/repos/explorer.tar.gz

# tar -xf plugins/repos/explorer.tar.gz -C plugins/repos/
# rm -rf plugins/repos/explorer.tar.gz

./hpm enable explorer