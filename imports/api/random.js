Math.seedrandom = function(seed) {
    let m_w = 123456789;
    let m_z = 987654321;
    const mask = 0xffffffff;

    return () => {
        m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
        m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
        let result = ((m_z << 16) + m_w) & mask;
        result /= 4294967296;
        return result + 0.5;
    }
}
