"use strict";

/*
	Straight-forward node.js arguments parser
	Author: eveningkid
	License: Apache-2.0
*/

const ARGUMENT_SEPARATION_REGEX = /([^=\s]+)=?\s*(.*)/;

type ParsedArgs = {
  [key: string]: string | number | boolean;
};

function parse(argv: string[]) {
  // Removing node/bin and called script name
  argv = argv.slice(2);

  const parsedArgs: ParsedArgs = {};
  let argName, argValue;

  argv.forEach(function (arg) {
    // Separate argument for a key/value return
    arg = arg.match(ARGUMENT_SEPARATION_REGEX);
    arg.splice(0, 1);

    // Retrieve the argument name
    argName = arg[0];

    // Remove "--" or "-"
    if (argName.indexOf("-") === 0) {
      argName = argName.slice(argName.slice(0, 2).lastIndexOf("-") + 1);
    }

    // Parse argument value or set it to `true` if empty
    argValue =
      arg[1] !== ""
        ? parseFloat(arg[1]).toString() === arg[1]
          ? +arg[1]
          : arg[1]
        : true;

    parsedArgs[argName] = argValue;
  });

  return parsedArgs;
}

export default parse;
