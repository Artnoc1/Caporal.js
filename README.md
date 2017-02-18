<p align="center">
    <img src="./assets/caporal.png">
</p>

# Caporal

> A full-featured framework for building command line applications (cli) with node.js,
> including help generation, colored output, verbosity control, custom logger, coercion
> and casting, typos suggestions, and auto-complete for bash/zsh/fish.
 

## Glossary

* **Program**: a cli app that you can build using caporal
* **Command**: a command within your program. A program may have multiple commands.
* **Argument**: a command may have one or more arguments passed after the command. 
* **Options**: a command may have one or more options passed after (or before) arguments.

Angled brackets (e.g. `<item>`) indicate required input. Square brackets (e.g. `[env]`) indicate optional input.

```javascript
#!/usr/bin/env node
const prog = require('caporal');
prog
  .version('1.0.0')
  // you specify arguments in .command()
  // 'app' is required, 'env' is optional
  .command('deploy', 'Deploy an application') 
  .argument('<app>', 'App to deploy', /^myapp|their-app$/)
  .argument('[env]', 'Environment to deploy on', /^dev|staging|prod$/, 'local')
  // you specify options using .option()
  // if --tail is passed, its value is required
  .option('--tail <lines>', 'Tail <lines> lines of logs after deploy', prog.INT) 
  .action(function(args, options, logger) {
    // args and options are objects
    // args = {"app": "myapp", "env": "production"}
    // options = {"tail" : 100}
  });

// ./myprog deploy myapp production --tail 100
```

### Variadic arguments

You can use `...` to indicate variadic arguments. In that case, the resulted value will be an array.

```javascript
#!/usr/bin/env node
const prog = require('caporal');
prog
  .version('1.0.0')
  // you specify arguments in .command()
  // 'app' and 'env' are required, and you can pass additional environments through not required
  .command('deploy <app> <env> [other-env...]', 'Deploy an application to one or more environments') 
  .action(function(args, options, logger) {
    console.log(args);
    // {
    //   "app": "myapp", 
    //   "env": "production",
    //   "otherEnv": ["google", "azure"]
    // }
  });

// ./myprog deploy myapp production aws google azure
```

### Single command program

For a very simple program with just one command, you can omit the .command() call:

```javascript
#!/usr/bin/env node
const prog = require('caporal');
prog
  .version('1.0.0')
  .description('A simple program that says "biiiip"')
  .action(function(args, options, logger) {
    logger.info("biiiip")
  });
```

## API

### `require('caporal)`

Returns a `Program` instance.

### Program API

#### .version(version) -> {Program}

Set the version of your program. You may want to use your `package.json` version to fill it:

```javascript
const myProgVersion = require('./package.json').version;
const prog = require('caporal');
prog
  .version(myProgVersion)
// [...]
```

#### .command(name, description) -> {Command}

Set up a new command with name and description. Multiple commands can be added to one program.
Returns a {Command}.

```javascript
const prog = require('caporal');
prog
  .version('1.0.0')
  // one command
  .command('walk', 'Make the player walk')
  .action((args, options, logger) => { logger.log("I'm walking !")}) // you must attach an action for your command
  // a second command
  .command('run', 'Make the player run')
  .action((args, options, logger) => { logger.log("I'm running !")})
  // a command may have multiple words
  .command('cook pizza', 'Make the player cook a pizza')
  .argument('<kind>', 'Kind of pizza')
  .action((args, options, logger) => { logger.log("I'm cooking a pizza !")})
// [...]
```

## Logging

Inside your action(), use the logger argument (third one) to log informations.

```javascript
#!/usr/bin/env node
const prog = require('caporal');
prog
  .version('1.0.0')
  .command('deploy <app> [env]', 'Deploy an application') 
  .option('--restart', 'Make the application restart after deploy') 
  .action((args, options, logger) => {
    // Available methods: 
    // - logger.debug()
    // - logger.info() or logger.log()
    // - logger.warn()
    // - logger.error()
    logger.info("Application deployed !");
  });
```

### Logging levels

The default logging level is 'info'. The predifined options can be used to change the logging level:

* `-v, --verbose`: Set the logging level to 'debug' so debug() logs will be output.
* `--quiet, --silent`: Set the logging level to 'warn' so only warn() and error() logs will be output. 

### Custom logger

caporal uses `winston` for logging. You can provide your own winston-compatible logger using `.logger()`
 the following way:

```javascript
#!/usr/bin/env node
const prog = require('caporal');
const myLogger = require('/path/to/my/logger.js');
prog
  .version('1.0.0')
  .logger(myLogger)
  .command('foo', 'Foo command description') 
  .action((args, options, logger) => {
    logger.info("Foo !!");
  });

```

* `-v, --verbose`: Set the logging level to 'debug' so debug() logs will be output.
* `--quiet, --silent`: Set the logging level to 'warn' so only warn() and error() logs will be output. 


## Coercion and casting

You can apply coercion and casting using either:
 * Caporal flags
 * Functions
 * RegExp

### Using Caporal flags

* `INT` (or `INTEGER`): Check option looks like an int and cast it with parseInt()  
* `FLOAT`: Will Check option looks like a float and cast it with parseFloat()
* `BOOL` (or `BOOLEAN`): Check for string like 0, 1, true, false, and cast it
* `LIST` (or `ARRAY`): Transform input to array by spliting it on comma  
* `REPEATABLE`: Make the option repeatable, eg `./mycli -f foo -f bar -f joe`
* `REQUIRED`: Make the option required in the command line

```javascript
#!/usr/bin/env node
const prog = require('caporal');
prog
  .version('1.0.0')
  .command('order pizza')
  .option('--number <num>', 'Number of pizza', prog.INT, 1)
  .option('--kind <kind>', 'Kind of pizza', /^margherita|hawaiian$/)
  .option('--discount <amount>', 'Discount offer', prog.FLOAT)
  .option('--add-ingredients <ingredients>', prog.LIST)
  .action(function(args, options) {
    // options.kind = 'margherita'
    // options.number = 1
    // options.addIngredients = ['pepperoni', 'onion']
    // options.discount = 1.25
  });

// ./myprog order pizza --kind margherita --discount=1.25 --add-ingredients=pepperoni,onion
```

```javascript
#!/usr/bin/env node
const prog = require('caporal');
prog
  .version('1.0.0')
  .command('concat') // concat files
  .option('-f <file>', 'File to concat', prog.REPEATABLE | prog.REQUIRED)
  .action(function(args, options) {

  });

// ./myprog order pizza --kind margherita --discount=1.25 --add-ingredients=pepperoni,onion
```

### Using a function

Using this method, you can check and cast user input. Make the check fail by throwing an error,
and cast input by returning a new value from your function. 


```javascript
#!/usr/bin/env node
const prog = require('caporal');
prog
  .version('1.0.0')
  .command('order pizza')
  .option('--kind <kind>', 'Kind of pizza', function(opt) {
    if (['margherita', 'hawaiian'].includes(opt) === false) {
      throw new Error("You can only order margherita or hawaiian pizza!");
    }
    return opt.toUpperCase();
  })
  .action(function(args, options) {
    // options = { "kind" : "MARGHERITA" }
  });

// ./myprog order pizza --kind margherita
```

### Using RegExp

Simply pass a RegExp object in the third argument to test against it.
**Note**: It is not possible to cast user input with this method, only check it, 
so it's basicaly only interesting for strings.

```javascript
#!/usr/bin/env node
const prog = require('caporal');
prog
  .version('1.0.0')
  .command('order pizza') // concat files
  .option('--kind <kind>', 'Kind of pizza', /^margherita|hawaiian$/)
  .action(function(args, options) {
    
  });

// ./myprog order pizza --kind margherita
```

## Auto-generated help

Caporal automaticaly generates help/usage instructions for you:



## Typo suggestions

Caporal will automaticaly make suggestions for option typos.
If set up --foot you pass --foo, caporal will suggest you --foot.

## Credits

Caporal is strongly inspired by [commander.js](https://github.com/tj/commander.js) and [Symfony Console](http://symfony.com/doc/current/components/console.html).
Caporal make use of teh following npm packages:
* chalk for colors
* cli-table2 for cli tables
* fast-levenshtein for suggestions
* minimist for argument parsing
* prettyjson to output json 
* winston for logging 