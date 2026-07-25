# uniform buffer objects

Profiling shows that calls to set uniforms account for ~25% of time! 

Apparently it's standard practice to use "Uniform Buffer Objects" to group together uniforms. Also, groups of uniforms can be shared across shaders.

Try grouping together stuff that can be shared for many objects in a camera view.

* atmos variables (density, contrast, colour)
* camera view, projection
* light positions and colours (though later expect to move to deferred)

Remaining uniforms are the kind of things that would move to attributes if used instanced rendering.

example usage:

https://gist.github.com/jialiang/2880d4cc3364df117320e8cb324c2880#file-ubo-tutorial-html