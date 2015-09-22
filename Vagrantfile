# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/precise64"

  # Forward server port
  config.vm.network :forwarded_port, host: 8000, guest: 8000, auto_correct: true

  # Provision the development environment
  config.vm.provision :shell, privileged: false, inline: <<-PROVISION
    cd /vagrant
    curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -
    sudo apt-get update
    sudo apt-get install -y firefox chromium-browser nodejs unzip openjdk-6-jre xvfb python python-dev python-pip
    sudo apt-get install -y libglapi-mesa libosmesa6 mesa-utils
    sudo npm install -g testem
    sudo pip install --upgrade pip
    sudo pip install -r requirements.txt
  PROVISION

  # Add more virtual memory
  config.vm.provider "virtualbox" do |v|
    v.memory = 1024
  end
end

