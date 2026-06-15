var dropCamera = (()=>{

    var dropCameraContainer = {
        matrix: mat4.create(),
        world:0
    }

    var updateDropCamera = (container) =>{
        mat4.set(container.matrix, dropCameraContainer.matrix);
        dropCameraContainer.world = container.world;
    }

    var setCameraToDropCamera = (cameraContainer) =>{
        mat4.set(dropCameraContainer.matrix, cameraContainer.matrix);
        cameraContainer.world = dropCameraContainer.world;
    }

    return {
        updateDropCamera,
        setCameraToDropCamera
    };

})();
