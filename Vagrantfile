# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/vivid64"

  # Forward server port
  config.vm.network :forwarded_port, host: 8000, guest: 8000, auto_correct: true

  # Provision the development environment
  config.vm.provision :shell, privileged: true, inline: "cd /vagrant; make prerequisites"
end

