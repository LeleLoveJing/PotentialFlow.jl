"""
    enforce_no_flow_through!(b::ConformalBody, motion, elements, t)

Update the body, `b`, to enforce the no-flow-through condition given ambient vortex elements, `elements`, and while moving with kinematics specified by `motion`.

# Example

```jldoctest
julia> p = Bodies.Polygon([-1.0,0.2,1.0,-1.0],[-1.0,-1.0,0.5,1.0])
Polygon with 4 vertices at
             (-1.0,-1.0) (0.2,-1.0) (1.0,0.5) (-1.0,1.0)
             interior angles/π = [0.5, 0.656, 0.422, 0.422]

julia> b = Bodies.ConformalBody(p)
Body generated by: Schwarz-Christoffel map of unit circle to exterior of polygon with 4 vertices

  centroid at 0.0 + 0.0im
  angle 0.0

julia> motion = RigidBodyMotion(1.0, 0.0);

julia> point = Vortex.Point(0.0 + 2im, 1.0);

julia> Bodies.enforce_no_flow_through!(b, motion, point, 0.0)

julia> b.img
1-element Array{PotentialFlow.Points.Point,1}:
 Vortex.Point(0.0 + 0.5im, -1.0)
```
"""
function enforce_no_flow_through!(b::ConformalBody, ṗ, elements, t)
    @get ṗ (ċ, α̇)

    # should set up images here

    b.ċ = ċ
    b.α̇ = α̇

    get_image!(b,elements)

    nothing
end

Elements.image(z::Complex128,b::ConformalBody) = 1.0/conj(z)

Elements.image(s::T,b::ConformalBody) where T <: Union{Blob,Point} = Elements.image(s.z,b)


function get_image!(b::ConformalBody, sources::T) where T <: Union{Tuple, AbstractArray}
    b.img = Points.Point[]
    for source in sources
        get_image!(b.img,source,b)
    end
    nothing
end

function get_image!(b::ConformalBody, source::T) where T <: Union{Blob,Point}
  get_image!(b.img,source,b)
end

get_image!(tmp,src,b::ConformalBody) = get_image!(tmp,Elements.unwrap_src(src), b, kind(Elements.unwrap_src(src)))

function get_image!(tmp,src,b::ConformalBody,::Type{Singleton})
  push!(tmp,get_image(src,b))
end


function get_image!(tmp,src,b::ConformalBody,::Type{Group})
  for i in eachindex(src)
      push!(tmp,get_image(src[i], b))
  end
end

function get_image(src::Union{Blob{T},Point{T}}, b::ConformalBody) where T <: Complex
    Point{T}(Elements.image(src.z,b),src.S)
end

function get_image(src::Union{Blob{T},Point{T}}, b::ConformalBody) where T <: Real
    Point{T}(Elements.image(src.z,b),-src.S)
end

"""
    vorticity_flux(b::ConformalBody, edge, sys, v, t,
                   tesp = 0.0)

Return strength of a new vortex element that satisfies edge suction parameter on an edge of a conformally-mapped body.
For a given edge, if the current suction parameter is less than the criticial suction parameter, then no vorticity is released.  If it is higher, however, vorticity will be released so that the suction parameter equals the critical value.

# Arguments

- `b`: the body
- `edge`: index of the vertex on the body corresponding to designated edge
- `sys`: current system of body and fluid vorticity
- `v`: the vortex element (with unit circulation) that the vorticity flux is going into
- `t`: the current time (for evaluating body motion)
- `tesp`: the critical trailing edge suction parameter we want to enforce.  By default, the parameters is set to 0.0 to enforce the Kutta condition on the edge.  We can disable vortex shedding from an edge by setting the its critical suction parameter to `Inf`

# Returns

- `Γ`: the strength that the vortex element should have in order to satisfy the edge suction parameters

"""
function vorticity_flux(b::Bodies.ConformalBody, edge::Integer, sys, v, t, tesp = 0.0)
    σ̃ = suction_parameter(edge,b,sys,t)

    # enforce boundary conditions for the elements v on a stationary airfoil
    db = deepcopy(b)
    motion = RigidBodyMotion(0.0, 0.0)
    Bodies.enforce_no_flow_through!(db, motion, v, 0)

    dσ = suction_parameter(edge,b,(db,v),t)

    Γ = circulation(v)

    if (abs2(tesp) > abs2(σ̃))
        K = 0.0
    else
        K = (sign(σ̃)*tesp - σ̃)/dσ
    end
    return K*Γ
end

function suction_parameter_factor(k::Integer,m::ExteriorMap)
    # Return the factor in front of the velocity tangent to the circle for vertex k
    beta = 1-m.angle
    zeta = m.preprev
    fact = (1+beta[k])^beta[k]*abs(m.constant)
    for j = 1:m.N
        if j == k
            continue
        end
        fact *= abs(zeta[k]-zeta[j])^beta[j]
    end
    return -fact^(-1/(1+beta[k]))
end
function suction_parameter(edge::Integer,b::Bodies.ConformalBody,sys,t)
    w̃ = induce_velocity(b,sys,t)
    σ = real(-im*conj(b.zetas[edge])*w̃[edge])*suction_parameter_factor(edge,b.m)
    return σ
end
