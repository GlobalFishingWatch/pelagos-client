#! /bin/bash

cd travis-data

user_email=$(git config --global user.email)
user_name=$(git config --global user.name)
git config --global user.email "travis@travis-ci.org"
git config --global user.name "Travis"

git add -f .
git commit --allow-empty -m "Data from travis build $TRAVIS_BUILD_NUMBER"
git push -fq origin travis-data > /dev/null

git config --global user.email $user_email
git config --global user.name $user_name
