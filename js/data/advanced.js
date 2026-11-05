import { PHASE_05, PHASE_06 } from './advanced-b.js';

/**
 * Advanced half of the ladder: phases 04 to 06.
 * Same lesson shape as curriculum.js, kept in its own file so the foundations stay readable.
 */
const d = (mode, children) => ({ type: 'dir', mode, owner: 'root', children });
const f = (mode, content, owner = 'root') => ({ type: 'file', mode, owner, content });

const NGINXLOG = [
  '10.10.14.31 - - [04/Nov/2026:21:02:11 +0000] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0"',
  '10.10.14.31 - - [04/Nov/2026:21:02:19 +0000] "GET /products.php?id=1 HTTP/1.1" 200 812 "-" "Mozilla/5.0"',
  "10.10.14.31 - - [04/Nov/2026:21:03:02 +0000] \"GET /products.php?id=1%27 HTTP/1.1\" 500 233 \"-\" \"sqlmap/1.7\"",
  "10.10.14.31 - - [04/Nov/2026:21:03:41 +0000] \"GET /products.php?id=1+UNION+SELECT+username,password+FROM+users HTTP/1.1\" 200 904 \"-\" \"sqlmap/1.7\"",
  '10.10.14.31 - - [04/Nov/2026:21:05:10 +0000] "GET /admin/upload.php HTTP/1.1" 200 331 "-" "Mozilla/5.0"',
  '10.10.14.31 - - [04/Nov/2026:21:05:55 +0000] "POST /admin/upload.php HTTP/1.1" 200 88 "-" "Mozilla/5.0"',
  '10.10.14.31 - - [04/Nov/2026:21:07:02 +0000] "GET /uploads/shell.php?cmd=id HTTP/1.1" 200 118 "-" "curl/7.81.0"',
  '10.10.14.31 - - [04/Nov/2026:21:09:44 +0000] "GET /uploads/shell.php?cmd=cat+/etc/shadow HTTP/1.1" 200 745 "-" "curl/7.81.0"',
  '10.10.14.44 - - [04/Nov/2026:22:14:02 +0000] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0 (Windows NT 10.0)"',
  '10.10.14.44 - - [04/Nov/2026:22:14:40 +0000] "GET /products.php?id=2 HTTP/1.1" 200 790 "-" "Mozilla/5.0 (Windows NT 10.0)"'
].join('\n');

const AUTH2 = [
  'Nov  4 21:07:30 web01 sshd[8140]: Accepted password for www-data from 10.10.14.31 port 44210 ssh2',
  'Nov  4 21:07:31 web01 sshd[8140]: pam_unix(sshd:session): session opened for user www-data by (uid=33)',
  'Nov  4 21:08:02 web01 sudo: www-data : TTY=pts/2 ; PWD=/var/www ; USER=root ; COMMAND=/bin/bash',
  'Nov  4 21:08:09 web01 audit: webshell dropped in /var/www/uploads/shell.php',
  'Nov  4 21:12:44 web01 sshd[8210]: Failed password for root from 10.10.14.44 port 51500 ssh2',
  'Nov  4 21:12:47 web01 sshd[8210]: Connection closed by 10.10.14.44 port 51500 [preauth]'
].join('\n');

export const ADVANCED_PHASES = [
  {
    id: 'phase-04',
    num: '04',
    title: 'Servers, containers and cloud',
    meta: 'the bits you will actually get hired to break',
    lessons: [
      {
        id: 'p4-docker',
        title: 'Containers, layers and the socket',
        sub: 'Image history leaks, and the mount that is basically root',
        minutes: 20,
        labType: 'terminal',
        concept: `
<h2>An image is just a stack of tarballs</h2>
<p>A Docker image is a filesystem plus metadata, built up in layers. Anything a layer writes stays in that
layer, even if a later layer deletes it. That is why <code>COPY .env /app/</code> followed by
<code>rm /app/.env</code> still leaks the secret: pull the image and read the earlier layer.</p>
<pre><code>docker history app:1.4
docker save app:1.4 -o app.tar && tar xf app.tar</code></pre>

<h3>Root inside is not root outside, unless you mount the socket</h3>
<p>Containers are not a security boundary by themselves. Two classic escapes:</p>
<ul>
  <li><strong>/var/run/docker.sock mounted in:</strong> anything that can talk to the socket can start a
  container that mounts the host root. Instant root, no exploit needed.</li>
  <li><strong>Privileged + a host mount:</strong> <code>--privileged -v /:/host</code> hands over the machine.</li>
</ul>

<h3>Things an auditor checks in five minutes</h3>
<ul>
  <li>Does the image run as root? Look for a <code>USER</code> line in the Dockerfile.</li>
  <li>Are secrets baked into the image or the compose file instead of a secret store?</li>
  <li>Is any host path mounted read-write that did not need to be?</li>
  <li>Is a registry or dashboard exposed without auth?</li>
</ul>
<div class="callout warn">"It runs in a container" is not a mitigation. Review the flags it was run with.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'You are on an app host. Read the build and run configuration like an attacker would.',
          fs: d('755', {
            srv: d('755', {
              app: d('755', {
                Dockerfile: f('644', [
                  'FROM node:18',
                  'WORKDIR /app',
                  'COPY .env /app/.env',
                  'COPY . /app',
                  'RUN rm /app/.env',
                  'RUN npm ci --omit=dev',
                  'EXPOSE 3000',
                  'CMD ["node", "index.js"]'
                ].join('\n')),
                'docker-compose.yml': f('644', [
                  'services:',
                  '  api:',
                  '    build: .',
                  '    ports: ["3000:3000"]',
                  '    volumes:',
                  '      - /var/run/docker.sock:/var/run/docker.sock',
                  '      - ./data:/app/data',
                  '    environment:',
                  '      - DB_HOST=db'
                ].join('\n')),
                '.env': f('644', [
                  'DB_HOST=db',
                  'DB_USER=app',
                  'DB_PASSWORD=Sup3rS3cretDbPass',
                  'FLAG=SARVAM{secret_baked_into_layer}'
                ].join('\n')),
                'index.js': f('644', 'const app = require("./src/app");\napp.listen(3000);\n'),
                src: d('755', { 'app.js': f('644', 'module.exports = (req, res) => res.send("ok");\n') }),
                data: d('777', {}),
                '.dockerignore': f('644', 'node_modules\n.git\n'),
                'notes.md': f('644', '- image built 2026-10-28, tag 1.4\n- socket mount added "temporarily" in August\n')
              })
            }),
            run: d('777', { 'docker.sock': f('666', 'sock') })
          }),
          tasks: [
            {
              id: 't1',
              prompt: 'The password was copied in and deleted in a later build step. Find it anyway and submit the flag.',
              hint: 'cat /srv/app/.env',
              answer: 'SARVAM{secret_baked_into_layer}'
            },
            {
              id: 't2',
              prompt: 'Which host path does the compose file mount that lets a container control the host? Give the full path.',
              hint: 'Read docker-compose.yml carefully.',
              answer: '/var/run/docker.sock'
            },
            {
              id: 't3',
              prompt: 'Which user does the container process run as? One word.',
              hint: 'No USER line in the Dockerfile means the base image default.',
              answer: 'root'
            }
          ]
        },
        cards: [
          { front: 'Why does deleting a file in a later Docker layer not remove the secret?', back: 'Layers are immutable. The earlier layer still contains the file, so pulling or extracting the image exposes it. Bake secrets at runtime, not at build.' },
          { front: 'Why is mounting /var/run/docker.sock into a container dangerous?', back: 'The container can talk to the Docker API and start a new container that mounts the host filesystem, which is effectively root on the host.' },
          { front: 'Which Dockerfile line decides the container user?', back: 'USER. With no USER line the process runs as the base image default, usually root.' }
        ]
      },
      {
        id: 'p4-cloud',
        title: 'Cloud storage and leaked credentials',
        sub: 'Public buckets, long-lived keys, and the metadata service',
        minutes: 20,
        labType: 'terminal',
        concept: `
<h2>Cloud bugs are mostly configuration bugs</h2>
<p>Nobody patches a bucket policy. The three findings that appear in report after report:</p>
<ul>
  <li><strong>Public read or list on storage:</strong> <code>GET /?list-type=2</code> returns the whole key
  listing, including backups nobody meant to publish.</li>
  <li><strong>Long-lived access keys in a repo, image or CI log:</strong> one leaked pair can outlive the
  employee who made it.</li>
  <li><strong>Instance metadata reachable from the app:</strong> the
  <code>169.254.169.254</code> endpoint hands out temporary role credentials to anything that can make an
  HTTP request, which is why SSRF on a cloud box is so valuable.</li>
</ul>
<pre><code>curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
aws s3 ls s3://company-backups --no-sign-request</code></pre>

<h3>What good looks like</h3>
<p>Block public access at the account level, scope policies to prefixes, rotate keys, prefer short-lived
role credentials, and log data-plane access so a surprise download shows up somewhere.</p>
<div class="callout">In a real engagement you only touch what the scope allows. Testing a public bucket is
authorised; downloading customer data is not. Read the flag, stop there.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'A storage endpoint answers on this network. Enumerate it, then check the laptop for credentials.',
          fs: d('755', {
            home: d('755', {
              student: d('755', {
                '.aws': d('700', {
                  credentials: f('600', [
                    '[default]',
                    'aws_access_key_id = AKIAIOSFODNN7EXAMPLE',
                    'aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                    '# note: created 2023, never rotated'
                  ].join('\n'), 'student')
                }),
                'engagement.md': f('644', 'Scope: storage.lab only. Do not touch customer buckets.\n')
              })
            })
          }),
          net: {
            myIp: '10.10.14.23',
            prefix: 24,
            gateway: '10.10.14.1',
            dns: '10.10.14.2',
            hosts: [
              {
                ip: '10.10.14.40',
                name: 'storage.lab',
                ports: [
                  {
                    port: 80,
                    state: 'open',
                    svc: 'http',
                    version: 'minio',
                    web: {
                      '/': 'Object storage. Try /?list-type=2 to list keys.',
                      '/?list-type=2': 'Keys:\n  public/logo.png\n  public/readme.txt\n  backups/db-2026-10-31.sql.gz\n  backups/employee-export.csv',
                      '/backups/db-2026-10-31.sql.gz': 'gzip data ... INSERT INTO audit VALUES ("SARVAM{public_bucket_backup}");',
                      '/backups/employee-export.csv': 'name,email,salary\n(500 rows)'
                    }
                  }
                ]
              }
            ]
          },
          tasks: [
            {
              id: 't1',
              prompt: 'List the bucket and find the backup object. What is its key path?',
              hint: 'curl "http://storage.lab/?list-type=2"',
              answer: 'backups/db-2026-10-31.sql.gz'
            },
            {
              id: 't2',
              prompt: 'Fetch that backup and submit the flag you find inside it.',
              hint: 'curl http://storage.lab/backups/db-2026-10-31.sql.gz',
              answer: 'SARVAM{public_bucket_backup}'
            },
            {
              id: 't3',
              prompt: 'How old are the access keys on this laptop? Answer with the year they were created.',
              hint: 'cat ~/.aws/credentials',
              answer: '2023'
            }
          ]
        },
        cards: [
          { front: 'What does a public bucket listing expose?', back: 'The names of every object, including backups and exports. Key names alone often reveal the structure and value of the data.' },
          { front: 'Why is SSRF on a cloud instance serious?', back: 'The instance metadata service at 169.254.169.254 hands out temporary IAM credentials to anything that can issue an HTTP request from the box.' },
          { front: 'Best fix for leaked long-lived cloud keys?', back: 'Rotate or delete the key, move to short-lived role credentials, and add commit scanning so the next leak is caught before it ships.' }
        ]
      }
    ]
  },
  PHASE_05,
  PHASE_06
];
