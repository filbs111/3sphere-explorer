//something to measure the rate of garbage collection or allocation
//for things like games, this rate can be ~constant, with characteristic sawtooth graph in performance monitor.
//chrome (and presumably other chromium browsers - tested ok in vivaldi) offers performance.memory.usedJSHeapSize

//if can sample heap size sufficiently frequently, or at opportune times (seems like GC happens after requestAnimationFrame callback returns),
//then might make good estimate of amount of garbage collected over time.

var heapPerfMon = (function(){
    if (!performance.memory || !performance.memory.usedJSHeapSize){
        return {
            sample:x=>{},
            delaySample:x=>{},
            read:x=>{},
            available:false
        }
    }
    
    //simple implementation - just look at the last, say, 10 GC events.
    //show amount collected, time since the first, ratio.

    //cyclic buffer or exponential decay version (don't need to remember past events) maybe better, but this is simple to understand

    var eventsToAverage=10;
    var recentGCEventTimes = new Array(10);
    var recentGCEventWindows = new Array(10);
    var recentGCEventAmounts = new Array(10);
    var lastHeapSize = 0;
    var lastSampleTime=0;
    var gcEventCount=0;

    //fill with something to start (so doesn't break if read too soon)
    for (var ii=0;ii<eventsToAverage;ii++){
        recentGCEventTimes[ii]=0;
        recentGCEventWindows[ii]=0;
        recentGCEventAmounts[ii]=0;
    }

    function sample(){
        var timeNow = Date.now();
        var heapSizeNow = performance.memory.usedJSHeapSize;
        if (heapSizeNow<lastHeapSize){
            addGCEvent(timeNow, lastHeapSize-heapSizeNow);
        }
        lastHeapSize=heapSizeNow;
        lastSampleTime=timeNow;
    }
    function delaySample(timer){
        setTimeout(sample,timer);
    }
    function addGCEvent(time, amount){
        gcEventCount++;
        for(var ii=0;ii<eventsToAverage-1;ii++){
            recentGCEventTimes[ii] = recentGCEventTimes[ii+1];
            recentGCEventWindows[ii]= recentGCEventWindows[ii+1];
            recentGCEventAmounts[ii]= recentGCEventAmounts[ii+1];
        }
        recentGCEventTimes[eventsToAverage-1] = time;
        recentGCEventWindows[eventsToAverage-1] = time - lastSampleTime;
        recentGCEventAmounts[eventsToAverage-1] = amount;
    }
    function read(){
        var timePeriod = recentGCEventTimes[eventsToAverage-1]-recentGCEventTimes[0];
        var totalAmount = 0;
        var totalGCEventWindows = 0;
        for (var ii=0;ii<eventsToAverage;ii++){
            totalAmount+=recentGCEventAmounts[ii];
            totalGCEventWindows+=recentGCEventWindows[ii];
        }
        var avgAmount=totalAmount/eventsToAverage;
        var avgPeriod=timePeriod/(eventsToAverage-1);
        var collectionRate = avgAmount/avgPeriod;
        return {
            avgAmount,                              //average memory GCed each GC event
            avgPeriod,                              //average time (ms) between GC events
            collectionRate,                         //rate of garbage collection
            gcEventCount,                           //num GC events detected since start
            ratio:totalGCEventWindows/timePeriod    //want this to be low. 1 worst. 0 best. if large, likely underestimating avgAmount
        };  //TODO don't return new object
    }
    return {
        sample,
        delaySample,
        read,
        available:true
    }
})();