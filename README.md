# cjjeakle.github.io

## About:
My homepage. <br/>
Check it out at [www.chrisjeakle.com](http://www.chrisjeakle.com).

## To Get Set Up:
1. Install or update [RVM](https://rvm.io/)
  - ```gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3```
  - ```\curl -sSL https://get.rvm.io | bash -s stable```<br/>
  or <br/>
  - ```rvm get stable```
2. Install at least the version of Ruby required by the Github Pages gem, for example: 2.1.0
  - ```rvm install 2.1.0```
  - ```rvm use 2.1.0```
  - ```rvm rubygems latest```
3. Install Bundler
  -  ```gem install bundler```
4. Install [Github Pages](https://help.github.com/articles/using-jekyll-with-pages/) using the included Gemfile
  - ```bundle install```
5. Start up the site!
  - ```bundle exec jekyll serve```

## To Develop and Debug:
Run: ```bundle exec jekyll serve```
