const glow_vertex_shader = `
    varying vec3 vPosition;
    void main()
    {    
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`
export {glow_vertex_shader}