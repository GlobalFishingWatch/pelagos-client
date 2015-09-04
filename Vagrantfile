# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"

  # Forward server port
  config.vm.network :forwarded_port, host: 8080, guest: 8080, auto_correct: true

  # Provision the development environment
  config.vm.provision :shell, path: "Vagrantprov", privileged: false

  # Add more virtual memory
  config.vm.provider "virtualbox" do |v|
    v.memory = 1024
  end
end

