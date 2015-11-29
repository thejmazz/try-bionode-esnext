async function foo() {
    console.log('wheee');
}

async function bar() {
    await foo();
}

bar();
