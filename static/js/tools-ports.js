(function () {
  const PORTS = [
    [20, 'TCP', 'ftp-data', 'FTP data channel'],
    [21, 'TCP', 'ftp', 'File transfer control'],
    [22, 'TCP', 'ssh', 'Secure shell'],
    [23, 'TCP', 'telnet', 'Legacy remote login'],
    [25, 'TCP', 'smtp', 'Mail transfer'],
    [53, 'TCP/UDP', 'dns', 'Name resolution'],
    [67, 'UDP', 'dhcp', 'DHCP server'],
    [68, 'UDP', 'dhcp', 'DHCP client'],
    [69, 'UDP', 'tftp', 'Trivial FTP'],
    [80, 'TCP', 'http', 'Web'],
    [88, 'TCP/UDP', 'kerberos', 'Auth (AD)'],
    [110, 'TCP', 'pop3', 'Mail retrieval'],
    [111, 'TCP/UDP', 'rpcbind', 'RPC portmapper'],
    [123, 'UDP', 'ntp', 'Time sync'],
    [135, 'TCP', 'msrpc', 'Windows RPC endpoint'],
    [137, 'UDP', 'netbios-ns', 'NetBIOS name'],
    [138, 'UDP', 'netbios-dgm', 'NetBIOS datagram'],
    [139, 'TCP', 'netbios-ssn', 'NetBIOS session / SMB legacy'],
    [143, 'TCP', 'imap', 'Mail'],
    [161, 'UDP', 'snmp', 'Network management'],
    [162, 'UDP', 'snmp-trap', 'SNMP traps'],
    [389, 'TCP', 'ldap', 'Directory (AD)'],
    [443, 'TCP', 'https', 'TLS web'],
    [445, 'TCP', 'smb', 'Windows file / AD'],
    [464, 'TCP/UDP', 'kpasswd', 'Kerberos password'],
    [465, 'TCP', 'smtps', 'SMTP over TLS'],
    [500, 'UDP', 'isakmp', 'IPsec IKE'],
    [514, 'UDP', 'syslog', 'Logging'],
    [515, 'TCP', 'printer', 'LPD'],
    [587, 'TCP', 'submission', 'Mail submission'],
    [636, 'TCP', 'ldaps', 'LDAP over TLS'],
    [993, 'TCP', 'imaps', 'IMAP TLS'],
    [995, 'TCP', 'pop3s', 'POP3 TLS'],
    [1433, 'TCP', 'mssql', 'Microsoft SQL'],
    [1521, 'TCP', 'oracle', 'Oracle DB'],
    [1723, 'TCP', 'pptp', 'Legacy VPN'],
    [2049, 'TCP/UDP', 'nfs', 'Network filesystem'],
    [2082, 'TCP', 'cpanel', 'cPanel'],
    [2083, 'TCP', 'cpanel-ssl', 'cPanel SSL'],
    [2181, 'TCP', 'zookeeper', 'Coordination'],
    [2375, 'TCP', 'docker', 'Docker API (insecure)'],
    [2376, 'TCP', 'docker-tls', 'Docker TLS'],
    [3000, 'TCP', 'dev-http', 'Common app / Grafana'],
    [3306, 'TCP', 'mysql', 'MySQL / MariaDB'],
    [3389, 'TCP', 'rdp', 'Remote Desktop'],
    [5432, 'TCP', 'postgres', 'PostgreSQL'],
    [5601, 'TCP', 'kibana', 'Kibana UI'],
    [5672, 'TCP', 'amqp', 'RabbitMQ'],
    [5900, 'TCP', 'vnc', 'VNC remote'],
    [5985, 'TCP', 'winrm-http', 'WinRM HTTP'],
    [5986, 'TCP', 'winrm-https', 'WinRM HTTPS'],
    [6379, 'TCP', 'redis', 'Redis'],
    [6443, 'TCP', 'k8s-api', 'Kubernetes API'],
    [8000, 'TCP', 'http-alt', 'Alt HTTP / dev'],
    [8080, 'TCP', 'http-proxy', 'Alt HTTP / proxy'],
    [8443, 'TCP', 'https-alt', 'Alt HTTPS'],
    [8888, 'TCP', 'http-alt', 'Dev / Jupyter'],
    [9000, 'TCP', 'sonarqube', 'Often Sonar / PHP-FPM'],
    [9090, 'TCP', 'prometheus', 'Prometheus / Cockpit'],
    [9200, 'TCP', 'elasticsearch', 'Elasticsearch HTTP'],
    [9300, 'TCP', 'es-transport', 'Elasticsearch transport'],
    [11211, 'TCP/UDP', 'memcached', 'Memcached'],
    [27017, 'TCP', 'mongodb', 'MongoDB'],
  ];

  const body = document.getElementById('port-body');
  const q = document.getElementById('port-q');
  const count = document.getElementById('port-count');
  if (!body) return;

  function render(filter) {
    const f = (filter || '').trim().toLowerCase();
    body.innerHTML = '';
    let n = 0;
    PORTS.forEach(([port, proto, svc, notes]) => {
      const hay = `${port} ${proto} ${svc} ${notes}`.toLowerCase();
      if (f && !hay.includes(f)) return;
      n++;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${port}</td><td>${proto}</td><td>${svc}</td><td>${notes}</td>`;
      body.appendChild(tr);
    });
    if (count) count.textContent = `${n} service${n === 1 ? '' : 's'} shown`;
  }

  q?.addEventListener('input', () => render(q.value));
  render('');
})();
