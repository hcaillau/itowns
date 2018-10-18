precision highp float;

#include <itowns/project_pars_vertex>
#include <itowns/projective_texturing_pars_vertex>
#include <logdepthbuf_pars_vertex>
#define EPSILON 1e-6

void main() {
    #include <begin_vertex>
    #include <project_vertex>
    #include <itowns/projective_texturing_vertex>
    #include <logdepthbuf_vertex>
}
