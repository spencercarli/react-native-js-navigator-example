import React from 'react';
import { View, StyleSheet } from 'react-native';

export const Route = () => null;

const buildSceneConfig = (children = []) => {
  const config = {};

  children.forEach(child => {
    config[child.props.name] = { key: child.props.name, component: child.props.component };
  });

  return config;
};

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

  handlePush = (sceneName) => {
    this.setState(state => ({
      ...state,
      stack: [...state.stack, state.sceneConfig[sceneName]],
    }));
  }

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
