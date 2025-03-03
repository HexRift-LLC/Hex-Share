const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');
const config = require('./middleware/config');
const figlet = require("figlet");
const chalk = require("chalk");
const axios = require("axios");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require('fs');
const yaml = require('js-yaml');
const { version } = require('./package.json');
const { Auth } = require('./API/auth.js');

const app = express();
const PRODUCT_ID = "Hex Share";
const currentVersion = version;
const tiers = config.tiers;

function displayWelcome() {
    console.clear();
    console.log("\n");
    console.log(
      chalk.red(
        figlet.textSync("Hex Share", {
          font: "ANSI Shadow",
          horizontalLayout: "full",
        })
      )
    );
    console.log("\n");
    console.log(chalk.red("━".repeat(70)));
    console.log(
      chalk.white.bold(
        "      Welcome to Hex Share - Your Next-Gen File Sharing Solution"
      )
    );
    console.log(chalk.red("━".repeat(70)), "\n");
  }

function watchConfig() {
    const configPath = path.join(__dirname, 'config', 'config.yml');
    
    fs.watch(configPath, (eventType, filename) => {
        if (eventType === 'change') {
            try {
                const newConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
                Object.assign(config, newConfig);
                console.log(chalk.green('[Config]'), 'Configuration reloaded successfully');
            } catch (error) {
                console.log(chalk.red('[Config]'), 'Error reloading configuration:', error);
            }
        }
    });
}

// Add tier middleware
app.use((req, res, next) => {
    if (req.user) {
        // Find user's tier based on Discord ID
        const userTier = Object.entries(tiers).find(([_, tier]) => 
            tier.users.includes(req.user.discordId)
        ) || ['free', tiers.free];

        // Attach tier info to user object
        req.user.tier = {
            ...userTier[1],
            name: userTier[1].name,
            icon: userTier[1].icon,
            storage_limit: userTier[1].storage_limit,
            badge_class: userTier[1].badge_class
        };
    }
    next();
});

  async function checkVersion() {
    try {
      const response = await axios.get(
        `https://hexrift.net/api/version/${PRODUCT_ID}?current=${currentVersion}`,
        {
          headers: {
            "x-api-key": "8IOLaAYzGJNwcYb@bm1&WOcr%aK5!O",
          },
        }
      );
  
      if (!response.data.version) {
        console.log(chalk.yellow("[Updater]"), "Version information not available");
        return;
      }
  
      if (response.data.same) {
        console.log(chalk.green("[Updater]"), `Hex Share (v${currentVersion}) is up to date!`);
        return true;
      } else {
        console.log(chalk.red("[Updater]"), 
          `Hex Share (v${currentVersion}) is outdated. Update to v${response.data.version}.`);
        process.exit(1);
      }
    } catch (error) {
      console.log(chalk.red("[Updater]"), "Version check failed:", 
        error.response?.data?.error || error.message);
      process.exit(1);
    }
  }

function startServer() {
// Database connection
mongoose
.connect(config.database.mongodb_uri)
.then(() => {
  console.log(chalk.green("[Database]"), "MongoDB connected successfully");
})
.catch((err) => {
  console.error(chalk.red("[Database]"), "MongoDB connection error:", err);
  process.exit(1);
});

// Session configuration
app.use(session({
    secret: config.server.session_secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: config.database.mongodb_uri }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

// Passport initialization
require('./middleware/passport');
app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/files', require('./routes/files'));

app.locals.config = config;

// Discord Bot Setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", () => {
  console.log(chalk.blue("[Bot]"), `Logged in as ${client.user.tag}`);
});

client.login(config.discord.bot_token).catch((err) => {
  console.error(chalk.red("[Bot]"), "Failed to login to Discord:", err);
});

// Root route
app.get('/', (req, res) => {
    res.render('login');
});

  // Start Server
  app.listen(config.server.port, () => {
    console.log(
      chalk.green("[System]"),
      `Hex Share is running on port: ${config.server.port}`
    );
  });
}
// Initial sequence
async function initialize() {
    displayWelcome();
    await checkVersion();
    watchConfig();
    startServer();
  }
  initialize();
