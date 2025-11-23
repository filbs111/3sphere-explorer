Want to solve

$\int e^{\sin^2\theta} d\theta$

Entering this into https://www.wolframalpha.com gives just a series expansion. Can get to this by using the series expansions of sin, exp. 

Ideas:

for just linear sections

$\int e^{x^2} dx = \frac{\sqrt\pi}{2}\text{erfi}(x) + \text{const}$

Here erfi is the imaginary error function. Some approximations are available, might be decent. https://en.wikipedia.org/wiki/Error_function

Simplify further - take atmos thickness like exp(x) for section. Each piece like

$\int e^x dx = e^x + \text{const}$

Tested this in test2/atmos-test-2.html

Implemented in game now.

# further work

make optimisations to deduplicate sin, exp calls in game (see expSectionsIntegral2 in test code)

NOTE currently fails if no atmos contrast - surfaces appear black. divide by zero? TODO refactor to avoid, or use no contrast shader variant for world levels without atmos contrast. FWIW "CONSTANT" atmos option as currently implemented seems too basic - just uses depth, not exp decay.

Since doing fog calc in vert shader, passing amount of fog along path from from vert to frag shader may be better than current practice of passing amount of fogging. (ie do the fogging = exp(-amount_of_fog) in frag shader after interpolation).

Now have a fast approximate fog calc, it might be doable to put fog calc properly in frag shader. If so can do deferred (ie fog in later pass using depth buffer)
