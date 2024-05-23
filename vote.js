async function start(times) {
    console.log(`VOTING start time: ${getTimestamp()}`);
    let logBatch = [];
    for (let counter = 0; counter <= times; counter++) {
        if (counter % 100 === 0) {
            logBatch.push(`VOTING ${counter}  ${getTimestamp()}`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        const isLast = counter === times;
        await checkVote();
        await checkMath();
        await checkSuccess(isLast || counter == 0 || counter % 100 == 0);
        // Print the batched logs and clear the batch
        if (logBatch.length > 0 && (isLast || counter % 100 === 0)) {
            console.log(logBatch.join('\n'));
            logBatch = [];
        }
    }
    console.log(`VOTING end time: ${getTimestamp()}`);
}

function getTimestamp(){
    var date = new Date()
    return date.toLocaleTimeString('it-IT')
}

function addbits(s) {
    return (s.match(/[+\-]?(\.\d+|\d+(\.\d+)?)/g) || [])
    .reduce((acc, val) => acc + parseFloat(val), 0);
}

async function checkVote() {
    if (await waitForElement('#PDI_answer61391008')) {
        document.getElementById('PDI_answer61391008').click();
        document.getElementById('pd-vote-button13755834').click();
    }
}

async function checkMath() {
    const mathFormExists = await waitForElementPresence('#pds-maths-form', '.pds-return-poll');
    if (mathFormExists) {
        const formula = document.querySelector('#pds-maths-form > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(1)').innerText.replace('=', '').replaceAll(' ', '');
        const answer = addbits(formula);
        document.querySelector('#pds-maths-form > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(2)').value = answer;
        document.getElementById('pd-vote-button13755834').click();
    }
}

async function checkSuccess(showDiff) {
    if (await waitForElement('.pds-return-poll')) {
        if (showDiff){
            checkDiff();
        }
        document.getElementsByClassName('pds-return-poll')[0].click();
    }
}

function checkDiff() {
    try {
        const votes = Array.from(document.getElementsByClassName('pds-feedback-votes'))
        .map(vote => parseInt(vote.innerText.replace(/[(),votes\s&]+/g, '')));
        console.log(`VOTING ${document.getElementsByClassName('pds-answer-text')[0].innerText} ${votes[0]}`);
        console.log(`VOTING ${document.getElementsByClassName('pds-answer-text')[1].innerText} ${votes[1]}`);
    } catch (error) {
        console.error('An error occurred while calculating the difference:', error);
    }
}
async function waitForElement(selector, timeout = 10000, interval = 0) {
    const startTime = performance.now();
    const waitForAnimationFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
    let elementFound = false;
    
    while (performance.now() - startTime < timeout) {
        if (!elementFound) {
            const element = document.querySelector(selector);
            if (element) {
                elementFound = true;
                return true;
            }
        }
        await waitForAnimationFrame();
        if (interval > 0) {
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    console.error(`Timeout of ${timeout}ms reached waiting for element with selector "${selector}"`);
    return false;
}
function waitForElementPresence(selector, stopSelector, options = {}) {
    const { intervalMs = 50, timeoutMs = 10000, throttleMs = 200 } = options;
    let checks = 0;
    
    return new Promise((resolve, reject) => {
        let observer;
        observer = new MutationObserver((mutationsList, observer) => {
            checks++;
            if (checks % (throttleMs / intervalMs) === 0) {
                setTimeout(() => {
                    if (document.querySelector(selector)) {
                        observer.disconnect();
                        resolve(true);
                    } else if (document.querySelector(stopSelector)) {
                        observer.disconnect();
                        resolve(false);
                    }
                }, throttleMs);
            } else {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(true);
                } else if (document.querySelector(stopSelector)) {
                    observer.disconnect();
                    resolve(false);
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout reached waiting for element presence. Selector: ${selector}, StopSelector: ${stopSelector}`));
        }, timeoutMs);
        
        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
    });
}
