# Build a JavaScript Navigator for React Native

Navigation is a hot, and often contested, topic in React Native. It's something nearly every app has, multiple solutions exists, and they each have their pros and cons.

There are great solutions out there ([React Navigation](https://reactnavigation.org/) and [React Native Navigation](https://wix.github.io/react-native-navigation/) are my top choices for a "real" app) but I think building a navigator is a _great_ exercise. It forces you to design an API, work with animations, handle gestures, and more.

So that's what we'll do today. We'll build a _basic_ JavaScript navigator for React Native.

## Requirements

We're going to build a navigator that allows us to keep a stack of cards. It should

- have a simple declarative API
- allow us to push new screens onto the stack
- pop the current one off the screen and go to the previous
- animate between screen transitions
- handle user gestures for swiping back (covered in part 2)

## Getting Started

I'll be using `create-react-native-app` to create my project. You can run the following in your terminal

```
create-react-native-app rn-js-navigator
```

You can then run the app on an iOS or Android simulator with `yarn run ios` or `yarn run android`, respectively.

## API Design

The navigator will have one `Navigator` component with which we wrap all of the valid screens. Each screen we want to register with the navigator will be passed in a `Route` component.

```javascript
<Navigator>
  <Route name="Screen1" component={Screen1} />
  <Route name="Screen2" component={Screen2} />
  <Route name="Screen3" component={Screen3} />
</Navigator>
```

The top level `Navigator` component is where all the actual work happens. The `Route` component allows us to pass various properties/configuration down for each screen - in this case a name (which will be used to specific which screen should be pushed) and a component (which component should actually be rendered).

Each route will get a `navigator` prop passed to it and on that `navigator` prop a `push` and `pop` function will be on it. Allowing for the following type of interaction:

```javascript
const Screen2 = ({ navigator }) => (
  <View style={[styles.screen, { backgroundColor: '#23395B' }]}>
    <Button
      title="Screen 3"
      onPress={() => navigator.push('Screen3')}
    />
    <Button
      title="Pop"
      onPress={() => navigator.pop()}
    />
  </View>
);
```

Alright, with the basic API outlined, lets get to writing some code.

## Boilerplate

First, let's create the three screens we'll use in our app. In `App.js` replace the file with the following

`App.js`
```javascript
import React from 'react';
import { StyleSheet, View, Button } from 'react-native';

const Screen1 = ({ navigator }) => (
  <View style={[styles.screen, { backgroundColor: '#59C9A5' }]}>
    <Button
      title="Screen 2"
      onPress={() => navigator.push('Screen2')}
    />
    <Button
      title="Pop"
      onPress={() => navigator.pop()}
    />
  </View>
);

const Screen2 = ({ navigator }) => (
  <View style={[styles.screen, { backgroundColor: '#23395B' }]}>
    <Button
      title="Screen 3"
      onPress={() => navigator.push('Screen3')}
    />
    <Button
      title="Pop"
      onPress={() => navigator.pop()}
    />
  </View>
);

const Screen3 = ({ navigator }) => (
  <View style={[styles.screen, { backgroundColor: '#B9E3C6' }]}>
    <Button
      title="Pop"
      onPress={() => navigator.pop()}
    />
  </View>
);

export default Screen1;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Now, let's create a `Navigator.js` file in which all of our navigation logic will live. Right now it's just going to be a skeleton of the exported components.

`Navigator.js`
```javascript
import React from 'react';

export const Route = () => null;

export class Navigator extends React.Component {
  render() {
    return null;
  }
}
```

Now, lets go back to `App.js` and use these new components to define our routes.

First we need to import our components.

`App.js`
```javascript
import { Navigator, Route } from './Navigator';
```

The replace

```javascript
export default Screen1;
```

with

`App.js`
```javascript
export default class App extends React.Component {
  render() {
    return (
      <Navigator>
        <Route name="Screen1" component={Screen1} />
        <Route name="Screen2" component={Screen2} />
        <Route name="Screen3" component={Screen3} />
      </Navigator>
    );
  }
}
```

If you see a blank white screen you're exactly where you should be!


## Rendering Screens

All of our screens are accessible via `this.props.children` in the Navigator component. You could render the first screen via

`Navigator.js`
```javascript
export class Navigator extends React.Component {
  render() {
    const CurrentScene = this.props.children[0].props.component;
    return <CurrentScene />;
  }
}
```

which should now show the green `Screen1` again. This works, but accessing everything via `this.props.children` won't work very well going forward. We're going to need some internal state.

First, we'll store a `stack` array which will track the current stack of rendered screens. It should default to the first child of `Navigator`. We're also going to create an easier to use `sceneConfig` object that will allow us to access all of the data we need quickly when pushing a new screen onto the stack.

First we'll create a `buildSceneConfig` function that accepts the `Navigator` children as an argument.

`Navigator.js`
```javascript
const buildSceneConfig = (children = []) => {
  const config = {};

  children.forEach(child => {
    config[child.props.name] = { key: child.props.name, component: child.props.component };
  });

  return config;
};
```

Inside of this function we'll populate an object that represents our `sceneConfig`. This results in the following data.

```javascript
{
  Scene1: {
    key: 'Scene1',
    component: Scene1,
  },
  Scene2: {
    key: 'Scene2',
    component: Scene2,
  },
  Scene2: {
    key: 'Scene2',
    component: Scene2,
  },
}
```

We can then use this function in the `constructor` of the `Navigator` component and store the result in state. We can also populate our `stack` with the first screen.

`Navigator.js`
```javascript
export class Navigator extends React.Component {
  constructor(props) {
    super(props);

    const sceneConfig = buildSceneConfig(props.children);
    const initialSceneName = props.children[0].props.name;

    this.state = {
      sceneConfig,
      stack: [sceneConfig[initialSceneName]],
    };
  }

  // ...
}
```

We can then use `this.state.stack` to render our screen.

`Navigator.js`
```javascript
export class Navigator extends React.Component {
  constructor(props) {
    super(props);

    const sceneConfig = buildSceneConfig(props.children);
    const initialSceneName = props.children[0].props.name;

    this.state = {
      sceneConfig,
      stack: [sceneConfig[initialSceneName]],
    };
  }

  render() {
    const CurrentScene = this.state.stack[0].component;
    return <CurrentScene />;
  }
}
```

## Push Action

If you were to press "Screen 2" at this point the app will error with `Cannot read property 'push' of undefined`.

That's because we aren't yet passing a `navigator` prop down to the scene. In this navigator prop we'll pass the push action. Let's write that push handler now.

`Navigator.js`
```javascript
export class Navigator extends React.Component {
  constructor(props) { ... }

  handlePush = (sceneName) => {
    this.setState(state => ({
      ...state,
      stack: [...state.stack, state.sceneConfig[sceneName]],
    }));
  }

  render() { ... }
}
```

All we're doing here is accepting a `sceneName`, which should correspond to a `name` prop given to one of our `Route` components and then finding the corresponding scene config for that route and adding it to the stack.

We can then need to make the `push` function available to the current scene.

`Navigator.js`
```javascript
export class Navigator extends React.Component {
  constructor(props) { ... }

  handlePush = (sceneName) => {
    this.setState(state => ({
      ...state,
      stack: [...state.stack, state.sceneConfig[sceneName]],
    }));
  }

  render() {
    const CurrentScene = this.state.stack[0].component;
    return <CurrentScene navigator={{ push: this.handlePush }} />;
  }
}
```

If you press "Screen 2" now now error occurs! But also nothing is displayed. Let's fix that.

To do so we'll need to loop over `this.state.stack` and render the screens (we'll take care of styling later).

First you'll need to import some components from React Native.

`Navigator.js`
```javascript
import { View, StyleSheet } from 'react-native';
```

We'll then loop over `this.state.stack` and render each scene. We'll also set up some styling for the container view.

`Navigator.js`
```javascript
export class Navigator extends React.Component {
  // ...

  render() {
    return (
      <View style={styles.container}>
        {this.state.stack.map((scene, index) => {
          const CurrentScene = scene.component;
          return (
            <CurrentScene
              key={scene.key}
              navigator={{ push: this.handlePush }}
            />
          );
        })}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
});
```

When you press a screen name you should now see something like this.

![Basic Push Action](./navigator-tutorial-assets/03-basic-push-action.gif)

## Pop Action
