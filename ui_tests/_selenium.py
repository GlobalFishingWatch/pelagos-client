import datetime
import selenium.webdriver
import selenium.common.exceptions
import selenium.webdriver.common.desired_capabilities

def start():
    capabilities = selenium.webdriver.common.desired_capabilities.DesiredCapabilities.CHROME.copy()
    #capabilities['loggingPrefs'] = {'browser': 'ALL'}
    options = selenium.webdriver.ChromeOptions()
    options.binary = '/usr/bin/chromium-browser'
    options.arguments.append("--ignore-gpu-blacklist")
    options.arguments.append("--no-sandbox")
    return selenium.webdriver.Chrome(desired_capabilities=capabilities, chrome_options=options)

def stop(driver):
    for line in driver.get_log("browser"):
        if line['level'] != 'DEBUG':
            timestamp = datetime.datetime.utcfromtimestamp(line['timestamp']/1000.0).strftime("%Y-%m-%d %H:%M:%S")
            print "%s: %s: %s" % (timestamp, line['level'], line['message'])

    driver.quit()

