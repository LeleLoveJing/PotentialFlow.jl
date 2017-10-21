var documenterSearchIndex = {"docs": [

{
    "location": "index.html#",
    "page": "Home",
    "title": "Home",
    "category": "page",
    "text": ""
},

{
    "location": "index.html#PotentialFlow-1",
    "page": "Home",
    "title": "PotentialFlow",
    "category": "section",
    "text": "a scaffolding for building 2D inviscid modelsThe main goal of this library is to remove as much boilerplate code as possible from inviscid modeling codes. The core operation in these models is simulating the dynamics of various interacting potential flow elements. In general, the simulation comes down to computing the velocities of the elements then applying some time-marching scheme to evolve the system forward in time. With this in mind, we want to construct a library that makes iteasy to define new flow elements and behaviors\nstraightforward for users to set up a system of elements\nintuitive to probe the state of any element in the system\neasy to define new time-marching schemes to fit the users needs"
},

{
    "location": "index.html#Installation-1",
    "page": "Home",
    "title": "Installation",
    "category": "section",
    "text": "This package requires Julia 0.6- and above. It is not a registered package, so it should be installed with:julia> Pkg.clone(\"git@github.com:darwindarak/PotentialFlow.jl.git\")Since it is still under heavy development, you should runjulia> Pkg.test(\"PotentialFlow\") # might take some timeto make sure things are working as intended andjulia> Pkg.update()to get the most recent version of the library and its dependencies.The plots in this documentation are generated using Plots.jl. You might want to install that too to follow the examples in the getting started guide or the Jupyter notebooks. The notebooks can also be run online here."
},

{
    "location": "manual/quickstart.html#",
    "page": "Getting Started",
    "title": "Getting Started",
    "category": "page",
    "text": ""
},

{
    "location": "manual/quickstart.html#getting-started-1",
    "page": "Getting Started",
    "title": "Getting Started",
    "category": "section",
    "text": "This getting started guide will introduce the main components of PotentialFlow.jl. The code examples here should be directly copy-paste-able into the Julia REPL (even with the julia> prompt and sample results).DocTestSetup = quote\n    srand(1)\nend"
},

{
    "location": "manual/quickstart.html#Creating-Flow-Elements-1",
    "page": "Getting Started",
    "title": "Creating Flow Elements",
    "category": "section",
    "text": "We start by importing the library and creating a single point vortex with unit circulation located at (1,1):julia> using PotentialFlow\n\njulia> p = Vortex.Point( 1.0 + 1.0im, 1.0 )\nVortex.Point(1.0 + 1.0im, 1.0)By convention, the arguments for element constructors are position(s), circulation/strength(s), followed by any type specific parameters. For example, a vortex blob at the same location as p with a blob radius of 0.1 is created withjulia> Vortex.Blob(1.0 + 1.0im, 1.0, 0.1)\nVortex.Blob(1.0 + 1.0im, 1.0, 0.1)We can use Julia's vectorized dot syntax to construct whole arrays of elements. For example, here we create five point vortices and five point sources:julia> N = 5;\n\njulia> zs = Complex.(randn(N), randn(N));\n\njulia> vortices = Vortex.Point.(zs + 1.5, rand(N))\n5-element Array{PotentialFlow.Points.Point{Float64},1}:\n Vortex.Point(1.7972879845354617 + 0.31111133849833383im, 0.42471785049513144)\n Vortex.Point(1.882395967790608 + 2.2950878238373105im, 0.773223048457377)\n Vortex.Point(0.9023655232717689 - 2.2670863488005306im, 0.2811902322857298)\n Vortex.Point(1.4895547553626243 + 0.5299655761667461im, 0.20947237319807077)\n Vortex.Point(0.660973145611236 + 0.43142152642291204im, 0.25137920979222494)\n\njulia> sources = Source.Point.(zs - 1.5, rand(N))\n5-element Array{PotentialFlow.Points.Point{Complex{Float64}},1}:\n Source.Point(-1.2027120154645383 + 0.31111133849833383im, 0.02037486871266725)\n Source.Point(-1.117604032209392 + 2.2950878238373105im, 0.2877015122756894)\n Source.Point(-2.0976344767282313 - 2.2670863488005306im, 0.859512136087661)\n Source.Point(-1.5104452446373757 + 0.5299655761667461im, 0.07695088688120899)\n Source.Point(-2.339026854388764 + 0.43142152642291204im, 0.6403962459899388)\nWe can mix different vortex types together by grouping them in tuples. For example, a collection of vortex elements consisting of the point vortices and vortex blobs created earlier can be grouped together with:julia> sys = (vortices, sources);note: Note\nThe Unicode characters used in the examples can be entered in the Julia REPL (and most text editors with the appropriate plugins) via tab completion..  For example:Γ: \\Gamma<TAB>\nΔ: \\Delta<TAB>\nẋ: x\\dot<TAB>\n🌀: \\:cyclone:<TAB>We can access properties of any vortex element by directly accessing its fields, for example:julia> p.z\n1.0 + 1.0im\nHowever, it is better practice to use accessor methods, such as:julia> Elements.position(p)\n1.0 + 1.0im\nsince not all element types store their position in a z field but they are all required to implement a Elements.position method (also see Elements.impulse and Elements.position). These accessor methods, combined with the dot syntax, also make it easier to work with properties of arrays and tuples of vortex elements.julia> Elements.circulation(vortices)\n1.939982714228534\n\njulia> Elements.circulation(sources)\n0.0\n\njulia> Elements.circulation(sys)\n1.939982714228534\n\njulia> Elements.circulation.(vortices)\n5-element Array{Float64,1}:\n 0.424718\n 0.773223\n 0.28119\n 0.209472\n 0.251379\n\njulia> Elements.position.(sources)\n5-element Array{Complex{Float64},1}:\n -1.20271+0.311111im\n  -1.1176+2.29509im\n -2.09763-2.26709im\n -1.51045+0.529966im\n -2.33903+0.431422im\n"
},

{
    "location": "manual/quickstart.html#Computing-Velocities-1",
    "page": "Getting Started",
    "title": "Computing Velocities",
    "category": "section",
    "text": "Now that we can create potential flow elements, we want to add in some dynamics. The key functions for this are the induce_velocity and induce_velocity! pair and self_induce_velocity!.induce_velocity(target, source, t) computes the complex velocity that a vortex element(s) source induces on a target at time t. The target can bea complex position\njulia> induce_velocity(0.0 + 0.0im , vortices, 0.0)\n0.05610938572529216 - 0.1319030126670981im\n\njulia> induce_velocity(0.0 + 0.0im , sys, 0.0)\n0.14592914759546077 - 0.1264803675281937im\n\na vortex element\njulia> induce_velocity(p, sys, 0.0)\n-0.004302294537820467 - 0.07805396403126988im\n\nan array/tuple of vortex elements\njulia> induce_velocity(vortices, sources, 0.0)\n5-element Array{Complex{Float64},1}:\n 0.0645438+0.00789838im\n  0.053907+0.0279029im\n 0.0706678-0.0271182im\n 0.0676412+0.0111206im\n  0.078947+0.0117864im\n\njulia> induce_velocity(sources, sys, 0.0)\n5-element Array{Complex{Float64},1}:\n    0.140692-0.0968066im\n -0.00338844-0.00482933im\n   0.0350822-0.105919im\n    0.122123-0.044777im\n  -0.0294289-0.0392489im\nThe in-place version, induce_velocity!(velocities, targets, source, t), computes the velocity and writes the results into a pre-allocated data structure. For example:julia> vel_vortices = zeros(Complex128, length(vortices))\n5-element Array{Complex{Float64},1}:\n 0.0+0.0im\n 0.0+0.0im\n 0.0+0.0im\n 0.0+0.0im\n 0.0+0.0im\n\njulia> induce_velocity!(vel_vortices, vortices, sources, 0.0);\n\njulia> vel_vortices\n5-element Array{Complex{Float64},1}:\n 0.0645438+0.00789838im\n  0.053907+0.0279029im\n 0.0706678-0.0271182im\n 0.0676412+0.0111206im\n  0.078947+0.0117864im\nTo make it easier to allocate velocities for more complex collections of vortex elements, the library provides the allocate_velocity function:julia> vels = allocate_velocity(sys);\n\njulia> typeof(vels)\nTuple{Array{Complex{Float64},1},Array{Complex{Float64},1}}The code above created a tuple containing two arrays of velocities, corresponding to the structure of sys. Similarly, there is also the reset_velocity!(velocities, sources) function, which resizes the entries in velocities to match the structure of sources if necessary, then sets all velocities to zero. We can compute the velocity that a source induces on the entire points/blobs system with:julia> src = Vortex.Point(1.0, 1.0);\n\njulia> induce_velocity!(vels, sys, src, 0.0)\n(Complex{Float64}[-0.067601+0.173242im, -0.0604154+0.023228im, 0.0700725-0.00301774im, -0.162041+0.149685im, -0.228068-0.179224im], Complex{Float64}[-0.0100056-0.0708409im, -0.0374576-0.0345609im, 0.0244871-0.033458im, -0.0128124-0.0606923im, -0.00605748-0.0468824im])\nIf we want the velocity that the points/blobs system induces on itself, we can callreset_velocity!(vels, sys)\ninduce_velocity!(vels[1], vortices, vortices)\ninduce_velocity!(vels[1], vortices, sources)\ninduce_velocity!(vels[2], sources, vortices)\ninduce_velocity!(vels[2], sources, sources)This becomes difficult to keep track of when sys gets larger or more complicated (e.g. nested collection of elements). Instead, we can use the self_induce_velocity! function, which takes care of applying all the pairwise interactions (recursively if need be):julia> reset_velocity!(vels, sys);\n\njulia> self_induce_velocity!(vels, sys, 0.0);"
},

{
    "location": "manual/quickstart.html#Time-Marching-1",
    "page": "Getting Started",
    "title": "Time Marching",
    "category": "section",
    "text": "using PotentialFlow\nusing Plots\nclibrary(:colorbrewer)\nsrand(1)\ndefault(colorbar_title=(\"Γ\"), grid = false, ratio = 1, legend = :none, colorbar = :right, markerstrokealpha = 0, markersize = 5, size = (600, 400))Now that we compute the velocities of a system of vortex elements, we can march the system forward in time to simulate its behavior. As an example, we will simulate of two clusters of vortex blobs merging.N = 200\nzs = Complex.(0.5randn(N), 0.5randn(N))\nΓs  = @. exp(-4abs2(zs))\ncluster₁ = Vortex.Blob.(zs + 1, Γs, 0.01)\ncluster₂ = Vortex.Blob.(zs - 1, Γs, 0.01)\n\nsys = (cluster₁, cluster₂)\nvels = allocate_velocity(sys)\nplot(sys, color = :reds, clim = (0, 1))\nsavefig(\"initial_clusters.svg\"); nothing # hide<object data=\"initial_clusters.svg\" type=\"image/svg+xml\"></object>Given an array or tuple of vortex elements and their velocities, we can compute their positions after some time interval with the advect!(x₊, x, ẋ, Δt) function, wherex₊ is where the new states are stored\nx is the current state\nΔt is the time interval\nẋ is the velocity.In our case, we will let x₊ and x both be set to sys:Δt = 0.01\nfor t in 0:Δt:1.0\n    reset_velocity!(vels, sys)\n    self_induce_velocity!(vels, sys, t)\n    advect!(sys, sys, vels, Δt)\nend\nplot(sys, color = :reds, clim = (0, 1))\nsavefig(\"final_clusters.svg\"); nothing # hide<object data=\"final_clusters.svg\" type=\"image/svg+xml\"></object>"
},

{
    "location": "manual/elements.html#",
    "page": "Elements",
    "title": "Elements",
    "category": "page",
    "text": ""
},

{
    "location": "manual/elements.html#Elements-1",
    "page": "Elements",
    "title": "Elements",
    "category": "section",
    "text": "DocTestSetup = quote\nusing PotentialFlow\nsrand(1)\nendThe library currently has four built-in potential flow elements:Vortex.Point\nVortex.Blob\nVortex.Sheet\nSource.Point\nSource.Blob\nPlate (at the moment, there can only be one plate in the fluid at at time)Most functions in the library that act on elements can take either a single element, or a collection of elements. These collections can be represented as an array or a tuple. Arrays should be used when the elements are the same type, for example:julia> points = Vortex.Point.(rand(Complex128, 5), rand(5))\n5-element Array{PotentialFlow.Points.Point{Float64},1}:\n Vortex.Point(0.23603334566204692 + 0.34651701419196046im, 0.5557510873245723)\n Vortex.Point(0.3127069683360675 + 0.00790928339056074im, 0.43710797460962514)\n Vortex.Point(0.4886128300795012 + 0.21096820215853596im, 0.42471785049513144)\n Vortex.Point(0.951916339835734 + 0.9999046588986136im, 0.773223048457377)\n Vortex.Point(0.25166218303197185 + 0.9866663668987996im, 0.2811902322857298)\n\njulia> Elements.impulse(points)\n1.3362266530178137 - 1.2821936908564113im\n\njulia> blobs = [Vortex.Blob(rand(Complex128), rand(), 0.1) for i in 1:5]\n5-element Array{PotentialFlow.Blobs.Blob{Float64},1}:\n Vortex.Blob(0.20947237319807077 + 0.25137920979222494im, 0.02037486871266725, 0.1)\n Vortex.Blob(0.2877015122756894 + 0.859512136087661im, 0.07695088688120899, 0.1)\n Vortex.Blob(0.6403962459899388 + 0.8735441302706854im, 0.27858242002877853, 0.1)\n Vortex.Blob(0.7513126327861701 + 0.6448833539420931im, 0.07782644396003469, 0.1)\n Vortex.Blob(0.8481854810000327 + 0.0856351682044918im, 0.5532055454580578, 0.1)\n\njulia> Elements.impulse(blobs)\n0.41217890550975256 - 0.7325028967929701imKnowing that every element has the same type allows the compiler to perform more aggressive optimizations. Tuples are used when we want to mix and match different element types. For example:julia> sys = (points, blobs);\n\njulia> Elements.impulse(sys)\n1.7484055585275664 - 2.0146965876493814imThis rest of this page documents the data types that represent these elements and some key functions that act on them. For more detailed examples, please refer to the Jupyter notebooks."
},

{
    "location": "manual/elements.html#PotentialFlow.Vortex.Point",
    "page": "Elements",
    "title": "PotentialFlow.Vortex.Point",
    "category": "Type",
    "text": "Vortex.Point(z::Complex128, Γ::Float64)\n\nA point vortex located at z with circulation Γ.\n\nA new point vortex can be created from an existing one by treating the existing point vortex as a function and passing in the parameter you want to change as keyword arguments. For example,\n\njulia> p = Vortex.Point(1.0, 1.0)\nVortex.Point(1.0 + 0.0im, 1.0)\n\njulia> p()\nVortex.Point(1.0 + 0.0im, 1.0)\n\njulia> p(Γ = 2.0)\nVortex.Point(1.0 + 0.0im, 2.0)\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Vortex.Blob",
    "page": "Elements",
    "title": "PotentialFlow.Vortex.Blob",
    "category": "Type",
    "text": "Vortex.Blob(z::Complex128, Γ::Float64, δ::Float64)\n\nA regularized point vortex located at z with circulation Γ and blob radius δ.\n\nA new vortex blob can be created from an existing one by treating the existing blob as a function and passing in the parameter you want to change as keyword arguments. For example,\n\njulia> b = Vortex.Blob(1.0, 1.0, 0.1)\nVortex.Blob(1.0 + 0.0im, 1.0, 0.1)\n\njulia> b()\nVortex.Blob(1.0 + 0.0im, 1.0, 0.1)\n\njulia> b(Γ = 2.0, δ = 0.01)\nVortex.Blob(1.0 + 0.0im, 2.0, 0.01)\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Vortex.Sheet",
    "page": "Elements",
    "title": "PotentialFlow.Vortex.Sheet",
    "category": "Type",
    "text": "Vortex.Sheet <: Elements.Element\n\nA vortex sheet represented by vortex blob control points\n\nFields\n\nblobs: the underlying array of vortex blobs\nSs: the cumulated sum of circulation starting from the first control point\nδ: the blob radius of all the vortex blobs\nzs: a mapped array that accesses the position of each control point\n\nConstructors:\n\nVortex.Sheet(blobs, Γs, δ)\nVortex.Sheet(zs, Γs, δ) where zs is an array of positions for the control points\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Source.Point",
    "page": "Elements",
    "title": "PotentialFlow.Source.Point",
    "category": "Type",
    "text": "Source.Point(z::Complex128, S::Float64)\n\nA point source located at z with strength S.\n\nA new point source can be created from an existing one by treating the existing source as a function and passing in the parameter you want to change as keyword arguments. For example,\n\njulia> p = Source.Point(1.0, 1.0)\nSource.Point(1.0 + 0.0im, 1.0)\n\njulia> p()\nSource.Point(1.0 + 0.0im, 1.0)\n\njulia> p(S = 2.0)\nSource.Point(1.0 + 0.0im, 2.0)\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Source.Blob",
    "page": "Elements",
    "title": "PotentialFlow.Source.Blob",
    "category": "Type",
    "text": "Source.Blob(z::Complex128, S::Float64, δ::Float64)\n\nA regularized point source located at z with strength S and blob radius δ.\n\nA new blob source can be created from an existing one by treating the existing blob as a function and passing in the parameter you want to change as keyword arguments. For example,\n\njulia> b = Source.Blob(1.0, 1.0, 0.1)\nSource.Blob(1.0 + 0.0im, 1.0, 0.1)\n\njulia> b()\nSource.Blob(1.0 + 0.0im, 1.0, 0.1)\n\njulia> b(S = 2.0, δ = 0.01)\nSource.Blob(1.0 + 0.0im, 2.0, 0.01)\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.Plate",
    "page": "Elements",
    "title": "PotentialFlow.Plates.Plate",
    "category": "Type",
    "text": "Plate <: Elements.Element\n\nAn infinitely thin, flat plate, represented as a bound vortex sheet\n\nConstructors\n\nPlate(N, L, c, α)\n\n\n\n"
},

{
    "location": "manual/elements.html#Built-in-Types-1",
    "page": "Elements",
    "title": "Built-in Types",
    "category": "section",
    "text": "Vortex.Point\nVortex.Blob\nVortex.Sheet\nSource.Point\nSource.Blob\nPlate"
},

{
    "location": "manual/elements.html#PotentialFlow.Elements.position",
    "page": "Elements",
    "title": "PotentialFlow.Elements.position",
    "category": "Function",
    "text": "Elements.position(src::Element)\n\nReturns the complex position of a potential flow element. This is a required method for all Element types.\n\nExample\n\njulia> point = Vortex.Point(1.0 + 0.0im, 1.0);\n\njulia> Elements.position(point)\n1.0 + 0.0im\n\njulia> points = Vortex.Point.([1.0im, 2.0im], 1.0);\n\njulia> Elements.position.(points)\n2-element Array{Complex{Float64},1}:\n 0.0+1.0im\n 0.0+2.0im\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Elements.circulation",
    "page": "Elements",
    "title": "PotentialFlow.Elements.circulation",
    "category": "Function",
    "text": "Elements.circulation(src)\n\nReturns the total circulation contained in src.\n\nExample\n\njulia> points = Vortex.Point.([1.0im, 2.0im], [1.0, 2.0]);\n\njulia> blobs = Vortex.Blob.([1.0im, 2.0im], [1.0, 2.0], 0.1);\n\njulia> Elements.circulation(points[1])\n1.0\n\njulia> Elements.circulation(points)\n3.0\n\njulia> Elements.circulation((points, blobs))\n6.0\n\njulia> Elements.circulation.(points)\n2-element Array{Float64,1}:\n 1.0\n 2.0\n\njulia> Elements.circulation.((points, blobs))\n(3.0, 3.0)\n\njulia> Elements.circulation(Source.Point(rand(), rand()))\n0.0\n\njulia> Elements.circulation(Source.Blob(rand(), rand(), rand()))\n0.0\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Elements.flux",
    "page": "Elements",
    "title": "PotentialFlow.Elements.flux",
    "category": "Function",
    "text": "Elements.flux(src)\n\nReturns the flux through a unit circle induced by src.\n\nExample\n\njulia> points = Source.Point.([1.0im, 2.0im], [1.0, 2.0]);\n\njulia> blobs = Source.Blob.([1.0im, 2.0im], [1.0, 2.0], 0.1);\n\njulia> Elements.flux(points[1])\n1.0\n\njulia> Elements.flux((points, blobs))\n6.0\n\njulia> Elements.flux.(points)\n2-element Array{Float64,1}:\n 1.0\n 2.0\n\njulia> Elements.flux.((points, blobs))\n(3.0, 3.0)\n\njulia> Elements.flux(Vortex.Point(rand(), rand()))\n0.0\n\njulia> Elements.flux(Vortex.Blob(rand(), rand(), rand()))\n0.0\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Elements.impulse",
    "page": "Elements",
    "title": "PotentialFlow.Elements.impulse",
    "category": "Function",
    "text": "Elements.impulse(src)\n\nReturn the aerodynamic impulse of src about (0,0):\n\nP = int boldsymbolx times boldsymbolomegamathrmdA\n\nThis is a required method for all vortex types.\n\nExample\n\njulia> sys = (Vortex.Point(1.0im, π), Vortex.Blob(1.0im, -π, 0.1));\n\njulia> Elements.impulse(sys[1])\n3.141592653589793 + 0.0im\n\njulia> Elements.impulse(sys)\n0.0 + 0.0im\n\n\n\n"
},

{
    "location": "manual/elements.html#Element-Properties-1",
    "page": "Elements",
    "title": "Element Properties",
    "category": "section",
    "text": "Elements.position\nElements.circulation\nElements.flux\nElements.impulse"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.append_segment!",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.append_segment!",
    "category": "Function",
    "text": "Sheets.append_segment!(sheet::Sheet, z, Γ)\n\nAppend a new segment with circulation Γ extending from the end of the sheet to z.\n\nExample\n\njulia> sheet = Vortex.Sheet(0:0.1:1, 0.0:10, 0.2)\nVortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2\n\njulia> sheet.blobs[end]\nVortex.Blob(1.0 + 0.0im, 0.5, 0.2)\n\njulia> Sheets.append_segment!(sheet, 1.1, 2.0)\n\njulia> sheet\nVortex Sheet: L ≈ 1.1, Γ = 12.0, δ = 0.2\n\njulia> sheet.blobs[end]\nVortex.Blob(1.1 + 0.0im, 1.0, 0.2)\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.truncate!",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.truncate!",
    "category": "Function",
    "text": "Sheets.truncate!(sheet, n::Int)\n\nRemove segments 0:n from sheet, and return the circulation in those segments.\n\nExample\n\njulia> sheet = Vortex.Sheet(0:0.1:1, 0.0:10, 0.2)\nVortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2\n\njulia> Sheets.truncate!(sheet, 5)\n4.0\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.redistribute_points!",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.redistribute_points!",
    "category": "Function",
    "text": "Sheets.redistribute_points!(sheet, zs, Γs)\n\nReturns the modified sheet with replacement control points at positions zs and strength Γs.\n\njulia> sheet = Vortex.Sheet(0:0.1:1, 0.0:10, 0.2)\nVortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2\n\njulia> sys = (sheet,)\n(Vortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2,)\n\njulia> Sheets.redistribute_points!(sheet, 0:0.2:2, 0.0:0.5:5)\nVortex Sheet: L ≈ 2.0, Γ = 5.0, δ = 0.2\n\njulia> sys[1]\nVortex Sheet: L ≈ 2.0, Γ = 5.0, δ = 0.2\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.remesh",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.remesh",
    "category": "Function",
    "text": "Sheets.remesh(sheet, Δs::Float64 , params::Tuple = ())\n\nUniformly redistribute the control points of the sheet to have a nominal spacing of Δs. Material quantities that should be redistributed along with the control points can be passed in as elements of params.\n\nReturns the tuple (z₌, Γ₌, L [, p₌]) where\n\nz₌ is an array with the positions of the uniformly distributed points\nΓ₌ is circulation interpolated onto z₌\nL is total length of the sheet\np₌ is a tuple containing the material quantities from params interpolated onto z₌\n\nExample\n\njulia> sheet = Vortex.Sheet(0:0.1:1, 0.0:10, 0.2)\nVortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2\n\njulia> age = collect(10.0:-1:0);\n\njulia> Sheets.remesh(sheet, 0.2, (age, ))\n(Complex{Float64}[0.0+0.0im, 0.25+0.0im, 0.5+0.0im, 0.75+0.0im, 1.0+0.0im], [0.0, 2.5, 5.0, 7.5, 10.0], 1.0, ([10.0, 7.5, 5.0, 2.5, 0.0],))\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.remesh!",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.remesh!",
    "category": "Function",
    "text": "Sheets.remesh!(sheet::Sheet, Δs::Float64, params::Tuple = ())\n\nSame as Sheets.remesh, except sheet is replaced internally by a uniformly interpolated control points. Returns the tuple (sheet, L, p₌) where\n\nsheet is the modified sheet\nL is total length of the sheet\np₌ is a tuple containing the material quantities from params interpolated onto the new control points of sheet\n\njulia> sheet = Vortex.Sheet(0:0.1:1, 0.0:10, 0.2)\nVortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2\n\njulia> age = collect(10.0:-1:0);\n\njulia> Sheets.remesh!(sheet, 0.2, (age,));\n\njulia> Elements.position.(sheet.blobs)\n5-element Array{Complex{Float64},1}:\n  0.0+0.0im\n 0.25+0.0im\n  0.5+0.0im\n 0.75+0.0im\n  1.0+0.0im\n\njulia> age\n5-element Array{Float64,1}:\n 10.0\n  7.5\n  5.0\n  2.5\n  0.0\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.split!",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.split!",
    "category": "Function",
    "text": "Sheets.split!(sheet, n::Int)\n\nRemove segments 0:n from sheet, and return those segments as a new sheet.\n\nExample\n\njulia> sheet = Vortex.Sheet(0:0.1:1, 0.0:10, 0.2)\nVortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2\n\njulia> sheet₋ = Sheets.split!(sheet, 5)\nVortex Sheet: L ≈ 0.4, Γ = 4.0, δ = 0.2\n\njulia> sheet\nVortex Sheet: L ≈ 0.6, Γ = 6.0, δ = 0.2\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.filter!",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.filter!",
    "category": "Function",
    "text": "Sheets.filter!(sheet, Δs, Δf[, params])\n\nRedistribute and filter the control points of a vortex sheet\n\nArguments\n\nsheet: the vortex sheet to be modified\nΔs: the nominal spacing between the uniform points\nΔf: the minimum length scale that the filter should allow to pass through\nparams: an optional tuple of vectors containing material properties\n\nReturns\n\nIf params is passed in, then its vectors will be overwritten by their interpolated values on the new control points, and the function returns the tuple (sheet, params). Otherwise, it returns (sheet, ())\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.filter_position!",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.filter_position!",
    "category": "Function",
    "text": "Sheets.filter_position!(s, Δf, L = arclength(z₌))\n\nFilter out any length scales in s that is smaller than Δf, storing the result back in s. s can be either a vector of complex positions, or a Vortex.Sheet.\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.arclength",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.arclength",
    "category": "Function",
    "text": "Sheets.arclength(s)\n\nCompute the polygonal arc length of s, where s can be either an vector of complex numbers or a Vortex.Sheet.\n\nExample\n\n```jldoctest julia> sheet = Vortex.Sheet(0:0.1:1, 0.0:10, 0.2) Vortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2\n\njulia> Sheets.arclength(sheet) 1.0\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Sheets.arclengths",
    "page": "Elements",
    "title": "PotentialFlow.Sheets.arclengths",
    "category": "Function",
    "text": "Sheets.arclengths(s)\n\nCumulative sum of the polygonal arc length of s, where s can be either an vector of complex numbers or a Vortex.Sheet.\n\nExample\n\njulia> sheet = Vortex.Sheet(0:0.1:1, 0.0:10, 0.2)\nVortex Sheet: L ≈ 1.0, Γ = 10.0, δ = 0.2\n\njulia> Sheets.arclengths(sheet)\n11-element Array{Float64,1}:\n 0.0\n 0.1\n 0.2\n 0.3\n 0.4\n 0.5\n 0.6\n 0.7\n 0.8\n 0.9\n 1.0\n\n\n\n"
},

{
    "location": "manual/elements.html#Methods-on-Vortex-Sheets-1",
    "page": "Elements",
    "title": "Methods on Vortex Sheets",
    "category": "section",
    "text": "Sheets.append_segment!\nSheets.truncate!\nSheets.redistribute_points!\nSheets.remesh\nSheets.remesh!\nSheets.split!\nSheets.filter!\nSheets.filter_position!\nSheets.arclength\nSheets.arclengths"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.edges",
    "page": "Elements",
    "title": "PotentialFlow.Plates.edges",
    "category": "Function",
    "text": "edges(plate)\n\nReturn the coordinates of the leading and trailing edges\n\nExample\n\njulia> p = Plate(128, 1.0, 0, π/4)\nPlate: N = 128, L = 1.0, c = 0.0 + 0.0im, α = 45.0ᵒ\n       LESP = 0.0, TESP = 0.0\n\njulia> Plates.edges(p)\n(0.3535533905932738 + 0.35355339059327373im, -0.3535533905932738 - 0.35355339059327373im)\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.enforce_no_flow_through!",
    "page": "Elements",
    "title": "PotentialFlow.Plates.enforce_no_flow_through!",
    "category": "Function",
    "text": "enforce_no_flow_through!(p::Plate, motion, elements, t)\n\nUpdate the plate, p, to enforce the no-flow-through condition given ambient vortex elements, elements, and while moving with kinematics specified by motion.\n\nExample\n\njulia> plate = Plate(128, 2.0, 0.0, π/3)\nPlate: N = 128, L = 2.0, c = 0.0 + 0.0im, α = 60.0ᵒ\n       LESP = 0.0, TESP = 0.0\n\njulia> motion = Plates.RigidBodyMotion(1.0, 0.0);\n\njulia> point = Vortex.Point(0.0 + 2im, 1.0);\n\njulia> Plates.enforce_no_flow_through!(plate, motion, point, 0.0)\n\njulia> plate\nPlate: N = 128, L = 2.0, c = 0.0 + 0.0im, α = 60.0ᵒ\n       LESP = 1.27, TESP = -1.93\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.vorticity_flux",
    "page": "Elements",
    "title": "PotentialFlow.Plates.vorticity_flux",
    "category": "Function",
    "text": "vorticity_flux(p::Plate, v₁, v₂,\n               lesp = 0.0, tesp = 0.0,\n               ∂C₁ = Vector{Complex128}(plate.N),\n               ∂C₂ = Vector{Complex128}(plate.N))\n\nReturn strengths of new vortex elements that satisfies edge suction parameters. For a given edge, if the current suction parameter is less than the criticial suction parameter, then no vorticity is released.  If it is higher, however, vorticity will be released so that the suction parameter equals the critical value.\n\nArguments\n\np: the plate\nv₁, v₂: the vortex elements (with unit circulation) that the vorticity flux is going into\nlesp, tesp: the critical leading and trailing edge suction parameters we want to enforce.  By default, both parameters are set to 0.0 to enforce the Kutta condition on both edges.  We can disable vortex shedding from an edge by setting the its critical suction parameter to Inf\n\nReturns\n\nΓ₁, Γ₂: the strengths that the vortex element should have in order to satisfy the edge suction parameters\n∂C₁, ∂C₂: Chebyshev coefficients of the normal velocity induced by the vortex elements Instead of running enforce_bc! with the new vortex elements, we can use this matrix to directly update the Chebyshev coefficients associated with the bound vortex sheet without recomputing all the velocities.\n\nExample\n\nEnforcing the trailing edge Kutta condition with an point vortex at negative infinity:\n\njulia> plate = Plate(128, 2.0, 0.0, π/6)\nPlate: N = 128, L = 2.0, c = 0.0 + 0.0im, α = 30.0ᵒ\n       LESP = 0.0, TESP = 0.0\n\njulia> motion = Plates.RigidBodyMotion(1.0, 0.0);\n\njulia> Plates.enforce_no_flow_through!(plate, motion, (), 0.0)\n\njulia> point = Vortex.Point(-Inf, 1.0);\n\njulia> _, Γ, _, _ = Plates.vorticity_flux(plate, (), point, 0.0, Inf);\n\njulia> Γ # should equal -πULsin(α) = -π\n-3.1415926535897927\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.vorticity_flux!",
    "page": "Elements",
    "title": "PotentialFlow.Plates.vorticity_flux!",
    "category": "Function",
    "text": "vorticity_flux!(p::Plate, v₁, v₂,\n                lesp = 0.0, tesp = 0.0,\n                ∂C₁ = Vector{Complex128}(plate.N),\n                ∂C₂ = Vector{Complex128}(plate.N))\n\nIn-place version of vorticity_flux, except instead of just returning the possible changes in plate Chebyshev coefficients, we modify plate.C with those changes so that no-flow-through is enforced in the presence of v₁ and v₂ with strengths that satisfy the suction parameters.\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.bound_circulation",
    "page": "Elements",
    "title": "PotentialFlow.Plates.bound_circulation",
    "category": "Function",
    "text": "bound_circulation(plate[, s])\n\nCompute the bound circulation between the trailing edge of the plate to s.\n\ns can be either a single normalized arc length coordinate (between -1 and 1), or a whole array of coordinates.\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.bound_circulation!",
    "page": "Elements",
    "title": "PotentialFlow.Plates.bound_circulation!",
    "category": "Function",
    "text": "bound_circulation!(Γs, plate[, ss])\n\nCompute the bound circulation between the trailing edge of the plate to ss, then store it in Γs.\n\nIf an array, ss, with normalized arc length coordinates is omitted, then the circulation will be computed at the plate's Chebyshev nodes.\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.rate_of_impulse",
    "page": "Elements",
    "title": "PotentialFlow.Plates.rate_of_impulse",
    "category": "Function",
    "text": "rate_of_impulse(plate, motion, elements::Source, velocities::Source)\n\nCompute the rate of change of impulse of a vortex element and its image relative to a plate.\n\nNote that this is not just the rate of impulse of the vortex element itself, but also includes the rate of impulse of the bound vortex sheet generated in response to the vortex element.\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.force",
    "page": "Elements",
    "title": "PotentialFlow.Plates.force",
    "category": "Function",
    "text": "force(plate, motion, elements, velocities, newelements = ())\n\nCompute the force on plate, given its motion and the state of the ambient vorticity.\n\nArguments\n\nplate: the plate\nmotion: a structure that contains the velocity, acceleration, and angular velocity of the plate.\nelements: vortex elements representing the ambient vorticity\nvelocities: the velocities of the vortex elements\nnewelements: an optional argument listing vortex elements that are just added to the flow field (it can be an element that is contained in elements)\nΔt: this is only required if newelements is not empty, we assume that the new vortex elements are created over the span of Δt\n\nReturns\n\nF: the force excerted on the plate in complex coordinates\n\n\n\n"
},

{
    "location": "manual/elements.html#PotentialFlow.Plates.surface_pressure",
    "page": "Elements",
    "title": "PotentialFlow.Plates.surface_pressure",
    "category": "Function",
    "text": "surface_pressure(plate, motion, te_sys, Γs₋, Δt)\n\nCompute the pressure difference across the plate along Chebyshev nodes.\n\nnote: Note\nThe pressure difference across the bound vortex sheet is given by:    p_-^+\n  = -rho left frac12(boldsymbolv^+ + boldsymbolv^-)\n               - boldsymbolv_b\n         right\n         cdot ( boldsymbolgamma times boldsymbolhatn)\n    +rho fracmathrmdGammamathrmdtwhere rho is the fluid density, boldsymbolv^pm is the velocity on either side of the plate, boldsymbolv_b is the local velocity of the plate, boldsymbolgamma is the bound vortex sheet strength, and Gamma is the integrated circulation. We will compute fracmathrmdGammamathrmdt using finite differences.  So we will need the circulation along the plate from a previous time-step in order to compute the current pressure distribution.  We assume that value of circulation at the trailing edge of the plate is equal the the net circulation of all the vorticity that has been shed from the trailing edge.\n\nArguments\n\nplate: we assume that the Plate structure that is passed in already enforces the no-flow-through condition\nmotion: the motion of the plate used to compute boldsymbolv_b\nte_sys: the system of vortex elements representing the vorticity shed from the trailing edge of the plate\nΓs₋: the circulation along the plate's Chebyshev nodes, this should be equivalent to calling Vortex.circulation(te_sys) .+ Vortex.bound_circulation(plate) from a previous time-step.\nΔt: time-step used to compute fracmathrmdGammamathrmdt using finite differences\n\nReturns\n\nΔp: the pressure difference across the plate along Chebyshev nodes\nΓs₊: the circulation along the plate at the current time-step (this value is used in computing the current Δp and can be used as the Γs₋ for computing pressure differences at the next time-step)\n\n\n\n"
},

{
    "location": "manual/elements.html#Methods-on-Plates-1",
    "page": "Elements",
    "title": "Methods on Plates",
    "category": "section",
    "text": "Plates.edges\nPlates.enforce_no_flow_through!\nPlates.vorticity_flux\nPlates.vorticity_flux!\nPlates.bound_circulation\nPlates.bound_circulation!\nPlates.rate_of_impulse\nPlates.force\nPlates.surface_pressure"
},

{
    "location": "manual/elements.html#Index-1",
    "page": "Elements",
    "title": "Index",
    "category": "section",
    "text": "Pages = [\"elements.md\"]"
},

{
    "location": "manual/velocities.html#",
    "page": "Computing Velocities",
    "title": "Computing Velocities",
    "category": "page",
    "text": ""
},

{
    "location": "manual/velocities.html#Computing-Velocities-1",
    "page": "Computing Velocities",
    "title": "Computing Velocities",
    "category": "section",
    "text": "DocTestSetup = quote\nusing PotentialFlow\nsrand(1)\nend"
},

{
    "location": "manual/velocities.html#Sources-and-Targets-1",
    "page": "Computing Velocities",
    "title": "Sources and Targets",
    "category": "section",
    "text": "Velocity computations in vortex models essentially boils down to pairwise interactions between sources and targets. We may be interested in how a system of vortex elements induces velocity on at point, at multiple points, on other vortex elements, or on itself.The three key functions for computing velocities areinduce_velocity(target, source, t)\ninduce_velocity!(velocity, target, source, t)\nself_induce_velocity!(velocity, source, t)The ! suffix in the last two function signatures indicate that the velocity argument will be overwritten by the results of the computation. In most cases, the induced velocities will be indpendent of the time t, but it is included in the function signatures for flexibility.Sources of velocity can be any one of:a single vortex element, e.g.\njulia> src = Vortex.Point(im, 1.0);\n\njulia> induce_velocity(0.0 + 0.0im, src, 0.0)\n0.15915494309189535 - 0.0im\nan array of homogenous vortex types, e.g.\njulia> srcs = Vortex.Point.([im, 1.0], 1.0);\n\njulia> induce_velocity(0.0 + 0.0im, srcs, 0.0)\n0.15915494309189535 - 0.15915494309189535im\na tuple of different vortex types, e.g.\njulia> srcs₂ = Vortex.Point.([2im, 2.0], -2.0);\n\njulia> sys = (srcs, srcs₂);\n\njulia> induce_velocity(0.0 + 0.0im, sys, 0.0)\n0.0 + 0.0imIn the examples above, the target was just complex number 0.0 + 0.0im. However we can also havean array of complex numbers, e.g.\njulia> targets = Complex128.(1:3);\n\njulia> induce_velocity(targets, src, 0.0)\n3-element Array{Complex{Float64},1}:\n 0.0795775+0.0795775im\n  0.031831+0.063662im\n 0.0159155+0.0477465im\nan array of vortex elements, e.g.\njulia> targets₂ = Vortex.Point.(im*(1.0:3), 1.0);\n\njulia> induce_velocity(targets₂, src, 0.0)\n3-element Array{Complex{Float64},1}:\n        0.0+0.0im\n  -0.159155+0.0im\n -0.0795775+0.0im\na tuple with any of the above, e.g.\njulia> targets₃ = Vortex.Point.(-3.0:-1, -1.0);\n\njulia> sys = (targets, (targets₂, targets₃));\n\njulia> induce_velocity(sys, src, 0.0)\n(Complex{Float64}[0.0795775+0.0795775im, 0.031831+0.063662im, 0.0159155+0.0477465im], (Complex{Float64}[0.0+0.0im, -0.159155+0.0im, -0.0795775+0.0im], Complex{Float64}[0.0159155-0.0477465im, 0.031831-0.063662im, 0.0795775-0.0795775im]))Since the structure of these targets can get complicated, e.g. nested tuples), the library also provides a set of functions for creating and resizing the velocity variable for in-place computations. For example:julia> vels = allocate_velocity(sys)\n(Complex{Float64}[0.0+0.0im, 0.0+0.0im, 0.0+0.0im], (Complex{Float64}[0.0+0.0im, 0.0+0.0im, 0.0+0.0im], Complex{Float64}[0.0+0.0im, 0.0+0.0im, 0.0+0.0im]))\n\njulia> induce_velocity!(vels, sys, src, 0.0)\n(Complex{Float64}[0.0795775+0.0795775im, 0.031831+0.063662im, 0.0159155+0.0477465im], (Complex{Float64}[0.0+0.0im, -0.159155+0.0im, -0.0795775+0.0im], Complex{Float64}[0.0159155-0.0477465im, 0.031831-0.063662im, 0.0795775-0.0795775im]))The remaining sections of this page list the documentation for all the relevant methods for computing velocities. More detailed examples that show these methods working together can be found in the getting started guide and the Jupyter notebooks."
},

{
    "location": "manual/velocities.html#PotentialFlow.Motions.allocate_velocity",
    "page": "Computing Velocities",
    "title": "PotentialFlow.Motions.allocate_velocity",
    "category": "Function",
    "text": "allocate_velocity(srcs)\n\nAllocate arrays of Complex128 to match the structure of srcs\n\nExample\n\njulia> points = Vortex.Point.(rand(Complex128, 2), rand(2));\n\njulia> blobs  = Vortex.Blob.(rand(Complex128, 3), rand(3), rand(3));\n\njulia> allocate_velocity(points)\n2-element Array{Complex{Float64},1}:\n 0.0+0.0im\n 0.0+0.0im\n\njulia> allocate_velocity((points, blobs))\n(Complex{Float64}[0.0+0.0im, 0.0+0.0im], Complex{Float64}[0.0+0.0im, 0.0+0.0im, 0.0+0.0im])\n\n\n\n"
},

{
    "location": "manual/velocities.html#PotentialFlow.Motions.reset_velocity!",
    "page": "Computing Velocities",
    "title": "PotentialFlow.Motions.reset_velocity!",
    "category": "Function",
    "text": "reset_velocity!(vels[, srcs])\n\nSet all velocities in vels to zero\n\nIf srcs is provided, then the arrays in vels are resized their source counterpart, if necessary.\n\nExample\n\njulia> ẋs = (rand(Complex128, 1), rand(Complex128, 1))\n(Complex{Float64}[0.236033+0.346517im], Complex{Float64}[0.312707+0.00790928im])\n\njulia> points = Vortex.Point.(rand(Complex128, 2), rand(2));\n\njulia> blobs  = Vortex.Blob.(rand(Complex128, 3), rand(3), rand(3));\n\njulia> reset_velocity!(ẋs, (points, blobs));\n\njulia> ẋs\n(Complex{Float64}[0.0+0.0im, 0.0+0.0im], Complex{Float64}[0.0+0.0im, 0.0+0.0im, 0.0+0.0im])\n\n\n\n"
},

{
    "location": "manual/velocities.html#PotentialFlow.Motions.induce_velocity",
    "page": "Computing Velocities",
    "title": "PotentialFlow.Motions.induce_velocity",
    "category": "Function",
    "text": "induce_velocity(target, element, time)\n\nCompute the velocity induced by element on target\n\ntarget can be:\n\na Complex128\na subtype of Vortex.PointSource\nan array or tuple of vortex elements\n\nwhile the element can be:\n\nany subtype of Vortex.Element\nan array or tuple of vortex elements\n\nExample\n\njulia> z = rand(Complex128)\n0.23603334566204692 + 0.34651701419196046im\n\njulia> point = Vortex.Point(z, rand());\n\njulia> srcs = Vortex.Point.(rand(Complex128, 10), rand(10));\n\njulia> induce_velocity(z, srcs[1], 0.0)\n0.08722212007570912 + 0.14002850279102955im\n\njulia> induce_velocity(point, srcs[1], 0.0)\n0.08722212007570912 + 0.14002850279102955im\n\njulia> induce_velocity(z, srcs, 0.0)\n-0.4453372874427177 - 0.10592646656959151im\n\njulia> induce_velocity(point, srcs, 0.0)\n-0.4453372874427177 - 0.10592646656959151im\n\n\n\n"
},

{
    "location": "manual/velocities.html#PotentialFlow.Motions.induce_velocity!",
    "page": "Computing Velocities",
    "title": "PotentialFlow.Motions.induce_velocity!",
    "category": "Function",
    "text": "induce_velocity!(vels, target, element, time)\n\nCompute the velocity induced by element on target and store the result in vels\n\nvels should be the output of a call to allocate_velocity, target can be an array or tuple of vortex elements, while the element can be:\n\nany subtype of Vortex.Element\nan array or tuple of vortex elements\n\nExample\n\njulia> cluster₁ = Vortex.Point.(rand(Complex128, 5), rand(5));\n\njulia> cluster₂ = Vortex.Point.(rand(Complex128, 5), rand(5));\n\njulia> targets = (cluster₁, cluster₂);\n\njulia> sources = Vortex.Blob.(rand(Complex128), rand(10), 0.1);\n\njulia> ẋs = allocate_velocity(targets);\n\njulia> induce_velocity!(ẋs, targets, sources, 0.0)\n(Complex{Float64}[-1.28772-1.82158im, 1.9386-1.64147im, -1.56438+1.57158im, -0.626254+0.375842im, -0.806568-0.213201im], Complex{Float64}[-0.583672-2.26031im, -0.329778-1.43388im, 0.426927+1.55352im, -0.93755+0.241361im, -1.08949-0.35598im])\n\n\n\n"
},

{
    "location": "manual/velocities.html#PotentialFlow.Motions.self_induce_velocity!",
    "page": "Computing Velocities",
    "title": "PotentialFlow.Motions.self_induce_velocity!",
    "category": "Function",
    "text": "self_induce_velocity!(vels, elements, time)\n\nCompute the self induced velocity of one or more vortex elements\n\nThis involves a recursive call to self_induce_velocity! and pairwise calls to mutually_induce_velocity!.\n\nExample\n\njulia> points = Vortex.Point.([-1, 1], 1.0)\n2-element Array{PotentialFlow.Points.Point{Float64},1}:\n Vortex.Point(-1.0 + 0.0im, 1.0)\n Vortex.Point(1.0 + 0.0im, 1.0)\n\njulia> vels = allocate_velocity(points)\n2-element Array{Complex{Float64},1}:\n 0.0+0.0im\n 0.0+0.0im\n\njulia> self_induce_velocity!(vels, points, 0.0) # should be ±0.25im/π\n2-element Array{Complex{Float64},1}:\n 0.0-0.0795775im\n 0.0+0.0795775im\n\n\n\n"
},

{
    "location": "manual/velocities.html#PotentialFlow.Motions.mutually_induce_velocity!",
    "page": "Computing Velocities",
    "title": "PotentialFlow.Motions.mutually_induce_velocity!",
    "category": "Function",
    "text": "mutually_induce_velocity!(vs₁, vs₂, e₁, e₂, t)\n\nCompute the mutually induced velocities between e₁ and e₂ at time t and store the results in vs₁ and vs₂\n\nThe default implementation simply calls induce_velocity! twice.  This method is meant to be overwritten to take advantage of symmetries in certain pairwise vortex interations.  For example, the velocity kernel for a point vortex is antisymmetric, so in computing the mutually induced velocities of two arrays of point vortices, we can half the number of calls to the velocity kernel.\n\n\n\n"
},

{
    "location": "manual/velocities.html#PotentialFlow.Motions.advect!",
    "page": "Computing Velocities",
    "title": "PotentialFlow.Motions.advect!",
    "category": "Function",
    "text": "advect!(srcs₊, srcs₋, vels, Δt)\n\nMoves the elements in srcs₋ by their corresponding velocity in vels over the interval Δt and store the results in src₊.\n\nsrcs₋ and srcs₊ can be either a array of vortex elements or a tuple.\n\nExample\n\njulia> points₋ = [Vortex.Point(x + 0im, 1.0) for x in 1:5];\n\njulia> points₊ = Vector{Vortex.Point}(5);\n\njulia> vels = [ y*im for y in 1.0:5 ];\n\njulia> advect!(points₊, points₋, vels, 1e-2);\n\njulia> points₊\n5-element Array{PotentialFlow.Points.Point{Float64},1}:\n Vortex.Point(1.0 + 0.01im, 1.0)\n Vortex.Point(2.0 + 0.02im, 1.0)\n Vortex.Point(3.0 + 0.03im, 1.0)\n Vortex.Point(4.0 + 0.04im, 1.0)\n Vortex.Point(5.0 + 0.05im, 1.0)\n\n\n\n"
},

{
    "location": "manual/velocities.html#PotentialFlow.Motions.advect",
    "page": "Computing Velocities",
    "title": "PotentialFlow.Motions.advect",
    "category": "Function",
    "text": "advect(src::Element, velocity::Complex128, Δt)\n\nReturn a new element that represents src advected by velocity over Δt.\n\nIf this method is implemented by any type T where kind(T) is a Singleton, then an array of type AbstractArray{T} can be passed in the first two arguments of advect!. Note that this method is usually only defined for singleton elements\n\nExample\n\njulia> point = Vortex.Point(1.0 + 0.0, 1.0);\n\njulia> advect(point, 1.0im, 1e-2)\nVortex.Point(1.0 + 0.01im, 1.0)\n\n\n\n"
},

{
    "location": "manual/velocities.html#Methods-1",
    "page": "Computing Velocities",
    "title": "Methods",
    "category": "section",
    "text": "allocate_velocity\nreset_velocity!\ninduce_velocity\ninduce_velocity!\nself_induce_velocity!\nmutually_induce_velocity!\nadvect!\nadvect"
},

{
    "location": "manual/velocities.html#Index-1",
    "page": "Computing Velocities",
    "title": "Index",
    "category": "section",
    "text": "Pages = [\"velocities.md\"]"
},

{
    "location": "manual/timemarching.html#",
    "page": "Time Marching",
    "title": "Time Marching",
    "category": "page",
    "text": ""
},

{
    "location": "manual/timemarching.html#Time-Marching-1",
    "page": "Time Marching",
    "title": "Time Marching",
    "category": "section",
    "text": "Coming soon..."
},

{
    "location": "manual/noflowthrough.html#",
    "page": "Enforcing No-Flow-Through",
    "title": "Enforcing No-Flow-Through",
    "category": "page",
    "text": ""
},

{
    "location": "manual/noflowthrough.html#Enforcing-No-Flow-Through-1",
    "page": "Enforcing No-Flow-Through",
    "title": "Enforcing No-Flow-Through",
    "category": "section",
    "text": "warning: Warning\nUnder construction...defddt1fracmathrmd1mathrmdt\n\nrenewcommandvecboldsymbol\nnewcommanduvec1vechat1\nnewcommandutangentuvectau\nnewcommandunormaluvecn\n\nrenewcommanddmathrmd\n\nnewcommandcrosstimes\nnewcommandabs1left1right\nnewcommandimmathrmi\nnewcommandeumathrme\nnewcommandpintint\nnewcommandconj11^star\nnewcommandRes2mathrmResleft(12right)\nnewcommandreal1mathrmReleft1right\nnewcommandimag1mathrmImleft1rightWe are interested in enforcing the no-flow-through condition on an infinitely thin, flat plate undergoing rigid body motion. The plate can be parameterized by its length, L, centroid position, vecc, and its angle of attack, alpha. Its motion is then specified by its centroid velocity, dotvecc, and angular velocity, dotvecalpha."
},

{
    "location": "manual/noflowthrough.html#Vortex-Sheet-Strength-1",
    "page": "Enforcing No-Flow-Through",
    "title": "Vortex Sheet Strength",
    "category": "section",
    "text": "The plate is represented with a bound vortex sheet that constantly adjusts its circulation to enforce no-flow-through on its surface. We can show that the distribution of circulation, gamma, is governed by the following integral equation:<details>\n<summary></summary>\nThe no-flow-through condition requires that the component of fluid velocity normal to the sheet must be equal to the normal velocity of the sheet itself, i.e.\n$$\n\\begin{align*}\n    \\unormal \\cdot \\vec{u}(\\vec{x}_s)\n& = \\unormal \\cdot \\left[ \\dot{\\vec{c}} + \\dot{\\alpha} \\cross (\\vec{x}_s - \\vec{c}) \\right] \\\\\n& = \\left(\\unormal \\cdot \\vec{c}\\right) + \\dot{\\alpha} l\n\\end{align*}\n$$\nwhere\n\n- $\\vec{u}$ is the fluid velocity\n- $\\vec{x}_s$ is a position on the plate\n- $\\unormal$ is a unit vector normal to the plate\n- $l \\in [ -L/2, L/2 ] $ is distance between $\\vec{x}_s$ from the plate centroid\n\nWe can decompose the velocity field at any point in the fluid into contributions from the bound vortex sheet, $\\vec{u}_s$, and the free vorticity in the ambient fluid, $\\vec{u}_A$:\n$$\n\\vec{u}(\\vec{x}) = \\vec{u}_s(\\vec{x}) + \\vec{u}_A(\\vec{x}),\n$$\nso the no-flow-through condition can be written as:\n$$\n\\unormal \\cdot \\vec{u}_s(\\vec{x}) = \\left(\\unormal \\cdot \\vec{c}\\right) + \\dot{\\alpha} l - \\unormal \\cdot \\vec{u}_A(\\vec{x}).\n$$\n\nThe velocity field induced by a vortex sheet, $\\vec{u}_x(\\vec{x})$, is given by\n$$\n\\vec{u}_s(\\vec{x}) = \\frac{1}{2\\pi}\n\\int_\\mathcal{C} \\gamma(l) \\,\\uvec{k} \\cross\n\\frac{\\vec{x} - \\vec{x}_s(l)}{\\abs{\\vec{x} - \\vec{x}_s(l)}^2}\n\\d{l}\n$$\nwhere\n\n- $\\gamma$ is the strength of the sheet\n- $\\mathcal{C}$ is the curve occupied by the sheet\n- $\\uvec{k}$ is the unit vector point out of the plane.\n\nThe position along the vortex sheet can be expressed as\n$$\n\\vec{x}_s(l) = \\vec{c} + l\\utangent\n$$\nwhere $\\utangent$ is the unit tangent along the sheet.\nSimilarly, since we are interested in evaluating the velocity along the sheet, we can write\n$$\n\\vec{x}(l) = \\vec{c} + \\lambda\\utangent.\n$$\nWe can then write self-induced velocity of the bound vortex sheet as\n$$\n\\vec{u}_s(\\lambda) = \\frac{\\unormal}{2\\pi}\n\\int_{-\\frac{L}{2}}^\\frac{L}{2} \\frac{\\gamma(l)}{\\lambda - l}\n\\d{l}.\n$$\nSubstituting this expression back into the no-flow-through condition, we get\n</p>\n</details>beginequation\nfrac12pi\nint_-L2^L2 fracgamma(lambda)l - lambda\ndlambda\n= unormal cdot vecdotc\n+ dotalpha l\n- unormal cdot vecu_A(l)\nlabeleqintegral-equation\nendequationThe solution to this integral equation can be found in [Muskhelishvili]. If the velocity induced by ambient vorticity on the plate can be expanded into a Chebyshev series:unormal cdot vecu_Al(s) = sum_n = 0 A_n T_n(s)and Gamma_A is the total circulation in the ambient fluid, then the solution to eqrefeqintegral-equation can be written as:<details>\n<summary> </summary>\nTo make it easier to work with Chebyshev series, we will apply a change of variables $s := \\frac{2l}{L}$ so that the integral above goes from $-1$ to $1$:\n$$\n\\frac{1}{2\\pi}\n\\int_{-1}^1 \\frac{\\gamma(s)}{\\sigma - s}\n\\d{s}\n= \\unormal \\cdot \\vec{\\dot{c}}\n+ \\frac{\\dot{\\alpha}L}{2} \\sigma\n- \\unormal \\cdot \\vec{u}_A(\\sigma)\n$$\nFrom <a href=\"#footnote-Muskhelishvili\">[Muskhelishvili]</a>, we have that if\n$$\n\\frac{1}{\\pi\\im} \\int \\frac{\\varphi(t)}{t - t_0} \\d{t} = f(t_0)\n$$\nthen\n$$\n\\varphi(t_0) = \\frac{1}{\\pi\\im\\sqrt{t_0 - 1}\\sqrt{t_0 + 1}}\n\\int \\frac{\\sqrt{t - 1}\\sqrt{t + 1}}{t - t_0} f(t) \\d{t}\n+\n\\frac{P(t_0)}{\\sqrt{t_0 - 1}\\sqrt{t_0 + 1}}\n$$\nwhere $P$ is an arbitrary polynomial that must be chosen to satisfy far-field boundary conditions.\n\nIn our case, we have $\\varphi := \\im \\gamma$ and\n$$\nf := 2\\sum_{n = 0}^\\infty A_n T_n(\\sigma) - 2\\unormal \\cdot \\vec{\\dot{c}} - \\dot{\\alpha}L \\sigma\n$$\nso\n$$\n\\gamma(\\sigma)\n=\n\\frac{-2}{\\pi\\sqrt{1 - \\sigma}\\sqrt{1 + \\sigma}}\n\\int_{-1}^1 \\frac{\\sqrt{1 - s}\\sqrt{1 + s}}{s - \\sigma}\n\\left(\n\\sum_{n = 0}^\\infty A_n T_n(s) - \\unormal \\cdot \\vec{\\dot{c}} - \\frac{\\dot{\\alpha}L}{2} s\n\\right) \\d{s}\n+\n\\frac{P(t_0)}{\\sqrt{1 - \\sigma}\\sqrt{1 + \\sigma}}\n$$\n\nThe integral above is made of terms with the form\n$$\n\\pint_{-1}^1\n\\frac{\\sqrt{1 - s}\\sqrt{1 + s}}{s - \\sigma} T_n(s)\n\\d{s}\n$$\nwhich we can simplify using the properties of Chebyshev polynomials into\n$$\n\\pint_{-1}^1\n\\frac{\\sqrt{1 - s}\\sqrt{1 + s}}{s - \\sigma} T_n(s)\n\\d{s}\n=\n\\begin{cases}\n-\\pi T_1(\\sigma) & n = 0 \\\\\n-\\frac{\\pi}{2} T_2(\\sigma) & n = 1 \\\\\n-\\frac{\\pi}{2} \\left[T_{n+1}(\\sigma) - T_{n-1}(\\sigma)\\right] & n \\ge 2\n\\end{cases}.\n$$\nThis gives us\n$$\n\\gamma(\\sigma)\n=\n\\frac{-2}{\\pi\\sqrt{1 - \\sigma}\\sqrt{1 + \\sigma}}\n\\left\\{\n-\\pi A_0 \\sigma\n-\\frac{\\pi}{2} A_1\n+\\sum_{n = 1}^\\infty -\\frac{\\pi}{2}A_n \\left[T_{n+1}(\\sigma) - T_{n-1}(\\sigma)\\right]\n+ \\pi \\left(\\unormal \\cdot \\vec{\\dot{c}}\\right)\\sigma\n+ \\frac{\\pi}{2}T_2(\\sigma)\\frac{\\dot{\\alpha}L}{2}\n\\right\\}\n+\n\\frac{P(t_0)}{\\sqrt{1 - \\sigma}\\sqrt{1 + \\sigma}}.\n$$\n\nWe can find $P$ by satisfying Kelvin's circulation theorem.\nThis means that the amount of circulation contained in the bound vortex sheet should the negative of the circulation contained in the ambient vorticity, i.e.\n$$\n\\Gamma_s := \\int_{-\\frac{L}{2}}^{\\frac{L}{2}} \\gamma \\d{l} = -\\Gamma_A\n$$\n\nAgain, we use properties of Chebyshev polynomials to reduce the integral to\n$$\n\\begin{align*}\n\\frac{L}{2}\\int_{-1}^1 \\frac{P(s)}{\\sqrt{1 - s}\\sqrt{1 + s}} \\d{s} & = -\\Gamma_A,\n\\end{align*}\n$$\nwhich means that\n$$\nP = -\\frac{2\\Gamma_A}{L\\pi}.\n$$\n\nSo the final expression for the bound circulation is:\n</details>beginequation\ngammal(s) =\nfrac-frac2Gamma_ALpi + 2(A_0 - unormal cdot vecdotc) T_1(s) + (A_1 - fracdotalphaL2)T_2(s)sqrt1 - s^2 - 2sqrt1 - s^2sum_n = 2^infty A_n U_n-1(s)\nlabeleqgamma\nendequationnote: Note\nThis might look more similar to results from thin-airfoil theory if we rewrite the Chebyshev polynomials using trigonometric functions:gammal(theta) =\nfrac-frac2Gamma_ALpi + 2(A_0 - unormal cdot vecdotc) costheta + (A_1 - fracdotalphaL2)cos(2theta)sintheta - 2sum_n = 2^infty A_n sin(ntheta)The key difference is that we are free to relax the Kutta condition at the trailing edge."
},

{
    "location": "manual/noflowthrough.html#Circulation-1",
    "page": "Enforcing No-Flow-Through",
    "title": "Circulation",
    "category": "section",
    "text": "In addition to the distribution of circulation along the plate, it will be useful to know the amount circulation contained between one end of the plate to an arbitrary point on its surface. By definition, we havebeginalign*\nGamma(l)  = int_-L2^l gamma(lambda) dlambda \nGammal(s) = fracL2int_-1^s gammal(sigma) dsigma\nendalign*We can integrate gamma term by term to obtain:<details>\n<summary></summary>\nIn equation $\\eqref{eq:gamma}$, the Chebyshev polynomial of the second kind in ther summation can be written in terms of Chebyshev polynomials of the first kind:\n$$\n2\\sqrt{1 - s^2}U_{n-1}(s)  = \\frac{T_{n-1}(s) - T_{n+1}(s)}{\\sqrt{1 - s^2}}.\n$$\nThis means that all the terms in equation $\\eqref{eq:gamma}$ can be expressed in the form:\n$$\n\\frac{T_n(s)}{\\sqrt{1 - s^2}}.\n$$\nThe integral of these terms are:\n$$\n\\begin{align*}\n\\int_{-1}^s \\frac{T_n(s)}{\\sqrt{1 - s^2}} \\d{s}\n& = \\int_{\\cos^{-1} s}^\\pi \\cos(n\\theta) \\d{\\theta} \\\\\n& = \\begin{cases}\n\\pi - \\cos^{-1}s &: n = 0 \\\\\n-\\frac{1}{n}\\sin\\left(n\\cos^{-1}s\\right) &: n > 0\n\\end{cases}.\n\\end{align*}\n$$\nWe can then multiply the expressions above with their corresponding coefficients to obtain:\n</details>Gammal(s)\n=Gamma_Aleft(fraccos^-1spi - 1right) - fracLsqrt1 - s^22left\n2left(A_0 - unormal cdot vecdotcright)\n+left(A_1 - fracdotalphaL2right)s\n+sum_n=2^infty\nA_n left(fracU_n(s)n+1 - fracU_n-2(s)n-1right)right[Muskhelishvili]: Muskhelishvili, Nikolaĭ Ivanovich, and Jens Rainer Maria Radok. Singular integral equations: boundary problems of function theory and their application to mathematical physics. Courier Corporation, 2008."
},

{
    "location": "manual/motions.html#",
    "page": "Plate Motions",
    "title": "Plate Motions",
    "category": "page",
    "text": ""
},

{
    "location": "manual/motions.html#Plate-Motions-1",
    "page": "Plate Motions",
    "title": "Plate Motions",
    "category": "section",
    "text": "CurrentModule = Plates.RigidBodyMotions\nDocTestSetup  = quote\n    using PotentialFlow\n    srand(1)\nendThe motion of a plate is specified through two data types:RigidBodyMotion is the type that should be used to represent the plate's velocity.  For example, in advect!(plate₊, plate₋, platevel, Δt), platevel is of type RigidBodyMotion. It contains the most current values (ċ, c̈, α̇) (the plate's centroid velocity and acceleration, and angular velocity, respectively), as well as a Kinematics type.\nKinematics is an abstract type representing a function that takes in a time and returns (ċ, c̈, α̇)"
},

{
    "location": "manual/motions.html#Motion-1",
    "page": "Plate Motions",
    "title": "Motion",
    "category": "section",
    "text": "By default, RigidBodyMotion assumes a constant translational and angular velocity. For example,julia> motion = Plates.RigidBodyMotion(1.0im, π/2)\nRigid Body Motion:\n  ċ = 0.0 + 1.0im\n  c̈ = 0.0 + 0.0im\n  α̇ = 1.57\n  Constant (ċ = 0.0 + 1.0im, α̇ = 1.5707963267948966)Here, Constant is a subtype of Kinematics that returns the same (ċ, c̈, α̇) triple at all timesjulia> motion.kin.([0.0, 1.0, 2.0])\n3-element Array{Tuple{Complex{Float64},Complex{Float64},Float64},1}:\n (0.0+1.0im, 0.0+0.0im, 1.5708)\n (0.0+1.0im, 0.0+0.0im, 1.5708)\n (0.0+1.0im, 0.0+0.0im, 1.5708)Calling Plates.RigidBodyMotion(1.0im, π/2) is equivalent doingkin = Plates.RigidBodyMotions.Constant(1.0im, π/2)\nmotion = Plates.RigidBodyMotion(1.0im, 0.0im, π/2, kin)\n\n# output\n\nRigid Body Motion:\n  ċ = 0.0 + 1.0im\n  c̈ = 0.0 + 0.0im\n  α̇ = 1.57\n  Constant (ċ = 0.0 + 1.0im, α̇ = 1.5707963267948966)The next section describes how to construct more interesting kinematics."
},

{
    "location": "manual/motions.html#Kinematics-1",
    "page": "Plate Motions",
    "title": "Kinematics",
    "category": "section",
    "text": "The Kinematics type is just an abstract type for functions that take in time and return the (ċ, c̈, α̇) triple.  Let's create a MyMotion type that describes a horizontally translating plate that also sinusoidally pitches about its centroid.import PotentialFlow.Plates.RigidBodyMotions: Kinematics\n\nstruct MyMotion <: Kinematics\n    U₀::Complex128\n    ω::Float64\nend\n\n(m::MyMotion)(t) = (m.U₀, 0.0im, sin(m.ω*t))\n\nsinusoid = MyMotion(1.0, π/4)\n\n# output\n\nMyMotion(1.0 + 0.0im, 0.7853981633974483)We can then evaluate sinusoid at different timesjulia> sinusoid.([0.0, 1.0, 2.0])\n3-element Array{Tuple{Complex{Float64},Complex{Float64},Float64},1}:\n (1.0+0.0im, 0.0+0.0im, 0.0)\n (1.0+0.0im, 0.0+0.0im, 0.707107)\n (1.0+0.0im, 0.0+0.0im, 1.0)"
},

{
    "location": "manual/motions.html#Profiles-1",
    "page": "Plate Motions",
    "title": "Profiles",
    "category": "section",
    "text": "To make defining complex kinematics a little eaiser, the library also provides a Profile type, an abstract type for real-valued functions of time. Before going into how to define new profiles, we'll first show an example of why we might want to represent functions as a type. We start off with a predefined profile, a smooth ramp:using Plots\nusing PotentialFlow.Plates.RigidBodyMotions\n\nramp = RigidBodyMotions.EldredgeRamp(6)\n\nT = linspace(-1, 4, 200)\nplot(T, ramp.(T), xlabel = \"t\", ylabel=\"Smoothed Ramp\",\n     legend = :none, linewidth = 2)\n\nsavefig(\"ramp.svg\"); nothing # hide<object data=\"ramp.svg\" type=\"image/svg+xml\"></object>Now suppose we want to scale the ramp and shift itshifted_ramp = -(ramp >> 2)\n\nplot(T, shifted_ramp.(T), xlabel = \"t\", ylabel=\"Smoothed Ramp\",\n     legend = :none, linewidth = 2, size=(600,300))\nsavefig(\"shifted_ramp.svg\"); nothing # hide<object data=\"shifted_ramp.svg\" type=\"image/svg+xml\"></object>then take its derivativeddt_ramp = d_dt(shifted_ramp)\n\nplot(T, ddt_ramp.(T), xlabel = \"t\", ylabel=\"Smoothed Ramp\",\n     legend = :none, linewidth = 2, size = (600, 200))\nsavefig(\"ddt_ramp.svg\"); nothing # hide<object data=\"ddt_ramp.svg\" type=\"image/svg+xml\"></object>We see that wrapping these functions in a type allows us to operate on them as if they values, making it easier to compose multiple motions together:ps_ramp = RigidBodyMotions.ColoniusRamp(5)\ncomposed_ramp = ramp - (ps_ramp >> 2)\n\nplot(T, composed_ramp.(T), xlabel = \"t\", ylabel=\"Smoothed Ramp\",\n     legend = :none, linewidth = 2, size = (600, 300))\nsavefig(\"composed_ramp.svg\"); nothing # hide<object data=\"composed_ramp.svg\" type=\"image/svg+xml\"></object>"
},

{
    "location": "manual/motions.html#Defining-a-profile-1",
    "page": "Plate Motions",
    "title": "Defining a profile",
    "category": "section",
    "text": "Defining a profile is done in two steps:Create a subtype of RigidBodyMotions.Profile that contains the relavant parameters, e.g.\nAdd a method on the type (see Function like objects)For example,using PotentialFlow.Plates.RigidBodyMotions\n\nstruct Sinusoid <: RigidBodyMotions.Profile\n    ω::Float64\nend\n\n(s::Sinusoid)(t) = sin(s.ω*t)which can then be used as follows:\nT = linspace(-6, 6, 200)\n\ns = Sinusoid(2.0)\nc = d_dt(2s >> 0.5)\n\nusing Plots\nplot(T, [s.(T) c.(T)], xlabel = \"t\", color = [\"#00BFFF\" \"#D4CA3A\"],\n     legend = :none, linewidth = 2)\nsavefig(\"custom_profile.svg\"); nothing # hide<object data=\"custom_profile.svg\" type=\"image/svg+xml\"></object>"
},

{
    "location": "manual/motions.html#PotentialFlow.Plates.RigidBodyMotions.Kinematics",
    "page": "Plate Motions",
    "title": "PotentialFlow.Plates.RigidBodyMotions.Kinematics",
    "category": "Type",
    "text": "An abstract type for types that takes in time and returns (ċ, c̈, α̇).\n\n\n\n"
},

{
    "location": "manual/motions.html#PotentialFlow.Plates.RigidBodyMotions.RigidBodyMotion",
    "page": "Plate Motions",
    "title": "PotentialFlow.Plates.RigidBodyMotions.RigidBodyMotion",
    "category": "Type",
    "text": "RigidBodyMotion\n\nA type to store the plate's current kinematics\n\nFields\n\nċ: current centroid velocity\nc̈: current centroid acceleration\nα̇: current angular velocity\nkin: a Kinematics structure\n\nThe first three fields are meant as a cache of the current kinematics while the kin field can be used to find the plate kinematics at any time.\n\n\n\n"
},

{
    "location": "manual/motions.html#PotentialFlow.Plates.RigidBodyMotions.d_dt-Tuple{PotentialFlow.Plates.RigidBodyMotions.Profile}",
    "page": "Plate Motions",
    "title": "PotentialFlow.Plates.RigidBodyMotions.d_dt",
    "category": "Method",
    "text": "d_dt(p::Profile)\n\nTake the time derivative of p and return it as a new profile.\n\nExample\n\njulia> s = Plates.RigidBodyMotions.Sinusoid(π)\nSinusoid (ω = 3.14)\n\njulia> s.([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n 0.0\n 1.0\n 0.707107\n\njulia> c = Plates.RigidBodyMotions.d_dt(s)\nd/dt (Sinusoid (ω = 3.14))\n\njulia> c.([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n  3.14159\n  1.92367e-16\n -2.22144\n\n\n\n"
},

{
    "location": "manual/motions.html#PotentialFlow.Plates.RigidBodyMotions.Pitchup",
    "page": "Plate Motions",
    "title": "PotentialFlow.Plates.RigidBodyMotions.Pitchup",
    "category": "Type",
    "text": "Pitchup <: Kinematics\n\nKinematics describing a pitchup motion (horizontal translation with rotation)\n\nConstructors\n\nFields\n\nU₀\nFreestream velocity\na\nAxis of rotation, relative to the plate centroid\nK\nNon-dimensional pitch rate K = dotalpha_0fracc2U_0\nα₀\nInitial angle of attack\nt₀\nNominal start of pitch up\nΔα\nTotal pitching angle\nα\nα̇\nα̈\n\n\n\n"
},

{
    "location": "manual/motions.html#PotentialFlow.Plates.RigidBodyMotions.Profile",
    "page": "Plate Motions",
    "title": "PotentialFlow.Plates.RigidBodyMotions.Profile",
    "category": "Type",
    "text": "An abstract type for real-valued functions of time.\n\n\n\n"
},

{
    "location": "manual/motions.html#Base.:*-Tuple{Number,PotentialFlow.Plates.RigidBodyMotions.Profile}",
    "page": "Plate Motions",
    "title": "Base.:*",
    "category": "Method",
    "text": "s::Number * p::Profile\n\nReturns a scaled profile with (s*p)(t) = s*p(t)\n\nExample\n\njulia> s = Plates.RigidBodyMotions.Sinusoid(π)\nSinusoid (ω = 3.14)\n\njulia> 2s\n2 × (Sinusoid (ω = 3.14))\n\njulia> (2s).([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n 0.0\n 2.0\n 1.41421\n\n\n\n"
},

{
    "location": "manual/motions.html#Base.:+-Tuple{PotentialFlow.Plates.RigidBodyMotions.Profile,PotentialFlow.Plates.RigidBodyMotions.AddedProfiles}",
    "page": "Plate Motions",
    "title": "Base.:+",
    "category": "Method",
    "text": "p₁::Profile + p₂::Profile\n\nAdd the profiles so that (p₁ + p₂)(t) = p₁(t) + p₂(t).\n\nExamples\n\njulia> ramp₁ = Plates.RigidBodyMotions.EldredgeRamp(5)\nlogcosh ramp (aₛ = 5.0)\n\njulia> ramp₂ = Plates.RigidBodyMotions.ColoniusRamp(5)\npower series ramp (n = 5.0)\n\njulia> ramp₁ + ramp₂\nAddedProfiles:\n  logcosh ramp (aₛ = 5.0)\n  power series ramp (n = 5.0)\n\n\njulia> ramp₁ + (ramp₂ + ramp₁) == ramp₁ + ramp₂ + ramp₁\ntrue\n\n\n\n\n"
},

{
    "location": "manual/motions.html#Base.:--Tuple{PotentialFlow.Plates.RigidBodyMotions.Profile}",
    "page": "Plate Motions",
    "title": "Base.:-",
    "category": "Method",
    "text": "-(p₁::Profile, p₂::Profile)\n\njulia> s = Plates.RigidBodyMotions.Sinusoid(π)\nSinusoid (ω = 3.14)\n\njulia> 2s\n2 × (Sinusoid (ω = 3.14))\n\njulia> (2s).([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n 0.0\n 2.0\n 1.41421\n\njulia> s = Plates.RigidBodyMotions.Sinusoid(π);\n\njulia> s.([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n 0.0\n 1.0\n 0.707107\n\njulia> (-s).([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n -0.0\n -1.0\n -0.707107\n\njulia> (s - s).([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n 0.0\n 0.0\n 0.0\n\n\n\n"
},

{
    "location": "manual/motions.html#Base.:>>-Tuple{PotentialFlow.Plates.RigidBodyMotions.Profile,Number}",
    "page": "Plate Motions",
    "title": "Base.:>>",
    "category": "Method",
    "text": "p::Profile >> Δt::Number\n\nShift the profile in time so that (p >> Δt)(t) = p(t - Δt)\n\nExample\n\njulia> s = Plates.RigidBodyMotions.Sinusoid(π);\n\njulia> s >> 0.5\nSinusoid (ω = 3.14) >> 0.5\n\njulia> (s >> 0.5).([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n -1.0\n  0.0\n  0.707107\n\njulia> (s << 0.5).([0.0, 0.5, 0.75])\n3-element Array{Float64,1}:\n  1.0\n  1.22465e-16\n -0.707107\n\n\n\n"
},

{
    "location": "manual/motions.html#Function-Documentation-1",
    "page": "Plate Motions",
    "title": "Function Documentation",
    "category": "section",
    "text": "Modules = [RigidBodyMotions]\nOrder   = [:type, :function]"
},

{
    "location": "manual/motions.html#Index-1",
    "page": "Plate Motions",
    "title": "Index",
    "category": "section",
    "text": "Pages   = [\"motions.md\"]"
},

{
    "location": "internals/properties.html#",
    "page": "Handing Pairwise Interactions",
    "title": "Handing Pairwise Interactions",
    "category": "page",
    "text": ""
},

{
    "location": "internals/properties.html#Handing-Pairwise-Interactions-1",
    "page": "Handing Pairwise Interactions",
    "title": "Handing Pairwise Interactions",
    "category": "section",
    "text": "DocTestSetup = quote\n	using PotentialFlow\nendWe want users to be able to define their own vortex types, as well as arbitrarily group and nest different vortex elements together. For example, suppose the user has defined a new element, MyVortexType, then they should be able to do something likemyvortices = MyVortexType.(...)\npoints = Vortex.Point.(...)\nsheet = Vortex.Sheet(...)\n\nsystem = (myvortices, (points, sheet))\nvelocities = allocate_velocity(system)\n\nself_induce_velocity!(velocities, system)But how would myvortices know how to induce velocities on points, sheet, or the tuple (points, sheet)? It would be asking a lot for the user to have to define all possible pairwise interactions between their new vortex type and all other built-in types. Instead, the user should only have to define induce_velocity between MyVortexType and a complex point, leaving library to simply just apply induce_velocity recursively to all ther targets. But how would the library know if a vortex element is actually a collection of more primitive types that should be recursed over? For example, while it is obvious that Vector{Vortex.Point} should be treated as a collection of point vortices, it has no prior knowledge of how MyVortexType is defined. It might be something like Vortex.Blob, which cannot recursed into, or it can be more like Vortex.Sheet, which is just a wrapper around Vector{Vortex.Blob}. The following section describes how the library handles this problem using Tim Holy's trait trick."
},

{
    "location": "internals/properties.html#Traits:-Singleton-vs.-Group-1",
    "page": "Handing Pairwise Interactions",
    "title": "Traits: Singleton vs. Group",
    "category": "section",
    "text": "Let's trace through how the library currently handles a call likeinduce_velocity(target::V1, source::V2)If the user has explicitly defined induce_velocity between the vortex types V1 and V2, then Julia will call that method. Otherwise, this call will be turned intoinduce_velocity(unwrap_targ(target), unwrap_src(source),\n                kind(unwrap_targ(target)), kind(unwrap_src(source)))There are two different things going on here:unwrap_targ and unwrap_src: There are some vortex types that are essentually wrappers around more primitive types. For example, Vortex.Sheet is a wrapper around Vector{Vortex.Blob}, with some extra information to maintain connectivity between the blobs. Instead of having to redefine all the required functions for Vortex.Sheet, we simply define the function Vortex.unwrap(s::Sheet) = s.blobs. Then whenever the library encounters a Vortex.Sheet, it will know to unwrap it and treat it as an array of Vortex.Blob. By default, unwrap_targ(v) = v and unwrap_src(v) = v.\nkind: This is a trait function takes a vortex element and returns either Type{Singleton} or Type{Group}. A vortex with trait Type{Singleton} tells the library that it should be treated as a single entity, and should not be recursed into. Alternatively, an element with Type{Group} trait tells that library that this element is indexable and should be iterated through.There are four possible (target,source) trait combinations:induce_velocity(uw_target, uw_source, ::Type{Singleton}, ::Type{Singleton})\ninduce_velocity(uw_target, uw_source, ::Type{Group}, ::Type{Singleton})\ninduce_velocity(uw_target, uw_source, ::Type{Singleton}, ::Type{Group})\ninduce_velocity(uw_target, uw_source, ::Type{Group}, ::Type{Group})but we only have to handle three cases:(::Type{Singleton}, ::Type{Singleton}): The fact that the call chain got to this point at all means, that there is no specialized induce_velocity defined between uw_target and uw_source, otherwise Julia's dispatch system would have call that one instead (see the induce_velocity definitions in Plates.jl). Since all vortex types are required to define induced_velocity on a point, this call is turned into\ninduce_velocity(Vortex.position(uw_target), uw_soruce)\n(::Type{Singleton}, ::Type{Group}): In this case, we iterate through i in 1:length(uw_source) and sum up the the results of induce_velocity(uw_target, uw_source[i])\n(::Type{Group}, ::Any): Since the output is no longer a scalar value, we first preallocate the output with allocate_velocity(uw_target), then iteratively apply induce_velocity over all the elements of uw_target. Once the target has been expanded all the way to Singleton types, then we are back to the (target, source) kind being either (::Type{Singleton}, ::Type{Group}) or (::Type{Singleton}, ::Type{Singleton}), which can be handled by the two cases listed above.Ultimately, this whole setup is just a way to allow induce_velocity to be called recursively on arbitrary groupings of vortex elements. However, velocity is not the only property that can be computed this way. Other quantities, such as acceleration, circulation, etcs., can all be be computed using the same framework. Instead of writing essentially the same code for all of them, we can use the @property macro"
},

{
    "location": "internals/properties.html#The-@property-macro-1",
    "page": "Handing Pairwise Interactions",
    "title": "The @property macro",
    "category": "section",
    "text": "All the induce_velocity methods listed above (and their in-place version, induce_velocity!) can be generated with@property begin\n    signature = induce_velocity(targ::Target, src::Source)\n    preallocator = allocate_velocity\n    stype = Complex128\nendwheresignature tells the macro what the function should be called as well as the roles of the different arguments.\npreallocator is the name you want to use to allocate output space for the targets\nstype is the data type of the output.note: Note\nYou can see the actual functions generated withjulia> import VortexModel.Vortex: @property\n\njulia> @macroexpand(@property begin\n           signature = induce_velocity(targ::Target, src::Source)\n           preallocator = allocate_velocity\n           stype = Complex128\n       end)Suppose we want a function to also get the acceleration of the vortex elements. To find the acceleration, we need to know the current velocity, so we can have something like@property begin\n    signature = induce_acceleration(targ::Target, targvel::Target, src::Source, srcvel::Source)\n    preallocator = allocate_acceleration\n    stype = Complex128\nendBy annotating targvel as a Target, we are saying that whenever you iterate through targ, we should pass in the corresponding element in targvel, and likewise for srcvel. Arguments that are not annotated will be treated as parameters to be passed in at each iteration without indexing.There are also properties that do not require a target, but are properties of the source itself. For example, we have@property begin\n    signature = circulation(src::Source)\n    stype = Float64\n    reduce = (+)\nendThe reduce operation means that it is a property that can be aggregate over a collection of vortex elements. In this particular case, it means that the circulation of a group of vortex elements is just the sum of the circulation of each element. Another example of this can be seen in the definition of rate_of_impulse."
},

{
    "location": "internals/properties.html#Defining-a-new-property-1",
    "page": "Handing Pairwise Interactions",
    "title": "Defining a new property",
    "category": "section",
    "text": "We'll go through an example of how to define new properties using the @property marco. Suppose we want to check if a system of elements have branch cuts in their streamfunction, we can simply define the following:import PotentialFlow.Properties: @property\n\n@property begin\n	signature = continuous_streamfunction(src::Source)\n	stype = Bool\n	reduce = (&, true)\nend\n\ncontinuous_streamfunction(::Vortex.Point) = true\ncontinuous_streamfunction(::Vortex.Blob) = true\ncontinuous_streamfunction(::Source.Point) = false\ncontinuous_streamfunction(::Source.Blob) = false\n\nvortices = (Vortex.Point.(rand(10), rand(10)), \n	        Vortex.Blob.(rand(10), rand(10), rand())\n		   )\n\nsources = (Source.Point.(rand(10), rand(10)),\n           Source.Blob.(rand(10), rand(10), rand())\n		  )\n\nmixed = (vortices, sources)\n\ncontinuous_streamfunction.((vortices, sources, mixed))\n\n# output\n\n(true, false, false)Here, the reduce operation is a tuple that takes in a binary operation and an initial value. When continuous_streamfunction is called on a group source, such as an array of elements, it will recursively call continuous_streamfunction on each member of the group, and use & to combine the results. Without the true initial value, the @property macro will use zero(stype), which in this case, would have been false. If we did not want the values to be aggregated, but instead wanted to preserve the organization structure of our source elements, we can simply leave out the reduce field. For instance, if we wanted to know whether the element is a desingularized element or not, it does not make sense to reduce the results.import PotentialFlow.Properties: @property\nimport PotentialFlow: Points, Blobs\n\n@property begin\n	signature = is_desingularized(src::Source)\n	stype = Bool\nend\n\nis_desingularized(::Points.Point) = false\nis_desingularized(::Blobs.Blob) = true\n\nvortices = (Vortex.Point.(rand(2), rand(2)), \n	        Vortex.Blob.(rand(2), rand(2), rand())\n		   )\n\nsources = (Source.Point.(rand(2), rand(2)),\n           Source.Blob.(rand(2), rand(2), rand())\n		  )\n\nis_desingularized.((vortices, sources))\n\n# output\n\n((Bool[false, false], Bool[true, true]), (Bool[false, false], Bool[true, true]))"
},

]}
