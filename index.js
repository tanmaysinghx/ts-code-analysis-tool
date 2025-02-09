import { ESLint } from 'eslint';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import chalk from 'chalk';
import pMap from 'p-map';
import ora from 'ora'; // Spinning progress indicator
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom logger for more refined console output
const logger = {
    info: (message) => console.log(chalk.blueBright(`ℹ️ ${message}`)),
    warn: (message) => console.log(chalk.yellowBright(`⚠️ ${message}`)),
    error: (message) => console.log(chalk.redBright(`❌ ${message}`)),
    success: (message) => console.log(chalk.greenBright(`✔️ ${message}`)),
    heading: (message) =>
        console.log(chalk.bold.white.bgBlue(`\n${message}\n`)),
};

// Function to print a fancy author banner using box-drawing characters and chalk
function printAuthorBanner() {
    const line = chalk.bgBlueBright.white.bold('────────────────────────────────────────────');
    const authorText = chalk.bgBlueBright.white.bold(
        '  Created with ❤️ by Tanmay Singh   '
    );
    const banner = `\n${line}\n${authorText}\n${line}\n`;
    logger.info(banner);
}

// Function to check and install missing dependencies
async function installMissingDependencies() {
    try {
        // Check if necessary ESLint plugins are installed
        execSync(
            'npm list @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import',
            { stdio: 'ignore' }
        );
        logger.info('Required dependencies are already installed.');
    } catch (err) {
        logger.warn('Missing required dependencies. Installing...');
        try {
            // Install missing dependencies automatically
            execSync(
                'npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import',
                { stdio: 'inherit' }
            );
            logger.success('Dependencies installed successfully.');
        } catch (installErr) {
            logger.error('Failed to install dependencies. Please install them manually.');
            throw installErr; // Re-throw the error to stop further processing
        }
    }
}

// Enhanced function to analyze code with a spinner and more refined output
async function analyzeCode(projectPath) {
    // Install missing dependencies if any
    await installMissingDependencies();

    // Initialize ESLint with base configuration and resolve plugins relative to this package
    const eslint = new ESLint({
        useEslintrc: false,
        resolvePluginsRelativeTo: __dirname,
        baseConfig: {
            parser: '@typescript-eslint/parser',
            plugins: ['@typescript-eslint', 'import', 'promise', 'node', 'security'],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                'plugin:import/errors',
                'plugin:import/warnings',
                'plugin:promise/recommended',
                'plugin:node/recommended',
            ],
            rules: {
                'no-unused-vars': 'warn',
                'no-undef': 'error',
                'no-console': 'warn',
                'no-unreachable': 'error',
                'no-debugger': 'warn',
                eqeqeq: 'warn',
                curly: 'warn',
                'no-empty': 'warn',
                'no-var': 'error',
                'prefer-const': 'warn',
                '@typescript-eslint/no-unused-vars': 'warn',
                '@typescript-eslint/explicit-function-return-type': 'warn',
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/no-inferrable-types': 'warn',
                'security/detect-object-injection': 'warn',
                'security/detect-non-literal-regexp': 'warn',
                'security/detect-unsafe-regex': 'warn',
            },
        },
    });

    const concurrencyLimit = 4;

    // Start spinner to show progress
    const spinner = ora('Analyzing code...').start();

    try {
        const files = glob.sync(`${projectPath.replace(/\\/g, '/')}/**/*.{js,jsx,ts,tsx}`);

        if (files.length === 0) {
            spinner.fail();
            logger.warn('No JavaScript or TypeScript files found.');
            return;
        }

        logger.heading(`Found ${files.length} file(s). Starting analysis...\n`);

        const results = await pMap(
            files,
            async (file) => {
                const fileStats = fs.statSync(file);
                if (!fileStats.isFile()) return null;
                const fileContent = fs.readFileSync(file, 'utf-8');
                const lintResults = await eslint.lintText(fileContent, { filePath: file });
                return { file, lintResults };
            },
            { concurrency: concurrencyLimit }
        );

        const validResults = results.filter((result) => result !== null);
        let issuesFound = false;
        let warningCount = 0;
        let errorCount = 0;

        validResults.forEach(({ file, lintResults }) => {
            if (lintResults.length > 0) {
                issuesFound = true;
                logger.success(`\nFile: ${file}`);
                lintResults.forEach((result) => {
                    result.messages.forEach((message) => {
                        const severityColor = message.severity === 2 ? chalk.red : chalk.yellow;
                        const severityIcon = message.severity === 2 ? '❌' : '⚠️';
                        const formattedMessage = `  ${severityIcon} Line ${message.line}: ${message.message} (Rule: ${message.ruleId})`;
                        console.log(severityColor(formattedMessage));
                        if (message.severity === 2) errorCount++;
                        else warningCount++;
                    });
                });
            }
        });

        spinner.succeed('Code analysis completed!');
        if (issuesFound) {
            logger.warn(`\nAnalysis Summary:`);
            logger.warn(`  Errors found: ${errorCount}`);
            logger.warn(`  Warnings found: ${warningCount}`);
        } else {
            logger.success('No issues found. 🎉');
        }

        // Print the beautiful author banner at the end
        printAuthorBanner();
    } catch (error) {
        spinner.fail();
        logger.error('Error during code analysis:');
        console.error(error);
    }
}

export default analyzeCode;
