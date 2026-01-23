function calculateSubnet24(ip) {
  if (!ip || typeof ip !== 'string') return null;
  
  const octets = ip.split('.');
  if (octets.length !== 4) return null;
  
  const nums = octets.map(Number);
  if (nums.some(n => isNaN(n) || n < 0 || n > 255)) return null;
  
  return `${nums[0]}.${nums[1]}.${nums[2]}.0/24`;
}

function parseIPSubnet(subnet) {
  const [ip] = subnet.split('/');
  const octets = ip.split('.').map(Number);
  return octets[0] * 16777216 + octets[1] * 65536 + octets[2] * 256 + octets[3];
}

function compareIPSubnets(a, b) {
  return parseIPSubnet(a) - parseIPSubnet(b);
}

function groupBySlash16(subnets) {
  const groups = new Map();
  
  for (const subnet of subnets) {
    const [ip, mask] = subnet.split('/');
    const octets = ip.split('.');
    const prefix = `${octets[0]}.${octets[1]}`;
    
    if (!groups.has(prefix)) {
      groups.set(prefix, new Set());
    }
    groups.get(prefix).add(subnet);
  }
  
  return groups;
}

function mergeSubnets(subnets) {
  if (subnets.size === 0) return new Set();
  
  const grouped = groupBySlash16(subnets);
  const result = new Set();
  
  for (const [prefix, subnet24s] of grouped.entries()) {
    if (subnet24s.size >= 4) {
      result.add(`${prefix}.0.0/16`);
    } else {
      for (const s of subnet24s) {
        result.add(s);
      }
    }
  }
  
  return result;
}

function addIPAndCalculateSubnet(domainData, ip) {
  if (!ip || !domainData) return;
  
  domainData.ips.add(ip);
  
  const subnet24 = calculateSubnet24(ip);
  if (subnet24) {
    domainData.subnets.add(subnet24);
    
    const merged = mergeSubnets(domainData.subnets);
    domainData.subnets = merged;
  }
}

function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  const octets = ip.split('.');
  if (octets.length !== 4) return false;
  
  return octets.every(octet => {
    const num = Number(octet);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

function sortSubnets(subnets) {
  return Array.from(subnets).sort(compareIPSubnets);
}
