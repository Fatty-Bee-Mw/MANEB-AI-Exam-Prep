const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const os = require('os');
const chalk = require('chalk');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    
    const localIP = getLocalIP();
    
    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.cyan('  🚀 MANEB Exam Prep AI - Server Running!'));
    console.log('='.repeat(60) + '\n');
    
    console.log(chalk.bold('  📱 Local Development:'));
    console.log(chalk.green(`     http://localhost:${port}`));
    console.log('');
    
    console.log(chalk.bold('  📱 Mobile Testing (Use this on your phone):'));
    console.log(chalk.yellow.bold(`     http://${localIP}:${port}`));
    console.log('');
    
    console.log(chalk.bold('  🌐 Network:'));
    console.log(chalk.cyan(`     Local IP: ${localIP}`));
    console.log(chalk.cyan(`     Port: ${port}`));
    console.log('');
    
    console.log(chalk.bold.green('  ✅ Instructions for Mobile Testing:'));
    console.log(chalk.white('     1. Make sure your phone is on the SAME WiFi'));
    console.log(chalk.white(`     2. Open browser on phone`));
    console.log(chalk.white(`     3. Go to: http://${localIP}:${port}`));
    console.log('');
    
    console.log(chalk.bold('  🔧 Admin Panel:'));
    console.log(chalk.magenta(`     http://localhost:${port}/admin`));
    console.log(chalk.magenta(`     http://${localIP}:${port}/admin`));
    console.log('');
    
    console.log('='.repeat(60));
    console.log(chalk.gray('  Press Ctrl+C to stop the server\n'));
  });
});
