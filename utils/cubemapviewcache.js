/*
intended to allow the reuse of cubemap renders, to allow reuse across quad views.
might also use for stereo mode when portal sufficiently far from viewer.
maybe should store cache with render details, but easiest just to clear cache upon starting a new quadview render,
and just store cubemaps for portal id.
*/

var cubemapViewCache = (() => {

    var viewsCreated = 0;   //for manually checking stays reasonable

    function power_of_2(n) {
        if (typeof n !== 'number') 
            return false;
    
        return (n >= 1) && (n & (n - 1)) === 0;
    }

    const urlParams = new URLSearchParams(window.location.search);
	var manualCubemapSize = Number(urlParams.get('cms'));
	var highestCubemapSize = power_of_2(manualCubemapSize) ? manualCubemapSize : 1024;
										//512 decent for 1080p end result. 1024 bit better. my machine handles 4096, but no point
										//TODO maybe drop max res if using other method for close to portal rendering.
	highestCubemapSize = Math.min(highestCubemapSize, 4096);	//disallow really big, because causes awful perf.
	highestCubemapSize = Math.max(highestCubemapSize, 64);	//disallow very small.
	
	console.log({manualCubemapSize, highestCubemapSize});

	var numLevels = 4;

    var pool = Array.from({ length: numLevels }, () => []);
    var cache = [];

    function clearCache(){
        cache.forEach(cacheItem => {
            pool[cacheItem.level].push(cacheItem.item);
        });
        cache = [];
    }

    function getCubemap(id){
        return cache[id];   //returns cubemap views if have a cubemap stored
    }

    function getNewCubemap(id, level){
        if (level>=numLevels){alert("attempted to get a cubemap level "+ level); return}
        if (getCubemap(id)){alert("attempting to get a new cubemap but already exists in cache!");}

        addToCache(id, level);
        return getCubemap(id);
    }

    function addToCache(id, level){
        var item = getFromPool(level);
        var cacheItem = {
            level,
            item
        };
        cache[id] = cacheItem;
        return cacheItem;
    }

    function getFromPool(level){
        return pool[level].pop() || createNewCubemapView(level);
    }

    function createNewCubemapView(level){
        viewsCreated++;
        return initCubemapFramebuffer(highestCubemapSize >> level);
    }

    function printCacheInfo(){
        console.log({
            pool,
            cache,
            viewsCreated
        });
    }

    return {
        clearCache,
        getCubemap,
        getNewCubemap,
        printCacheInfo
    }
    //usage -
    //  on starting a new render (eg quadview), clear the cache.
    // on each "realtime" portal draw, check the cache by getCubemap(). if exists, use that
    // otherwise use getNewCubemap
})();