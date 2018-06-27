import React from 'react';
import { Animated, View, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const Route = (props) => <props.component />;

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
    const initialSceneName = props.initialSceneName || props.children[0].props.name;
    this.state = {
      sceneConfig,
      stack: [sceneConfig[initialSceneName]],
    };
    this._animatedValue = new Animated.Value(0);
  }

  handlePush = (sceneName) => {
    this.setState(state => ({
      ...state,
      stack: [...state.stack, state.sceneConfig[sceneName]],
    }), () => {
      this._animatedValue.setValue(0);
      Animated.timing(this._animatedValue, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }

  handlePop = () => {
    Animated.timing(this._animatedValue, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      this._animatedValue.setValue(1);
      this.setState(state => {
        const { stack } = state;
        if (stack.length > 1) {
          return {
            stack: stack.slice(0, stack.length - 1),
          };
        }

        return state;
      });
    });
  }

  render() {
    const { backgroundColor } = this.props;
    const { sceneConfig, stack } = this.state;

    return (
      <View style={[styles.container, { backgroundColor }]}>
        {stack.map((scene, index) => {
          const CurrentScene = scene.component;
          const sceneStyles = [styles.scene];

          if (index === stack.length - 1 && index > 0) {
            sceneStyles.push({
              transform: [
                {
                  translateX: this._animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  })
                }
              ]
            });
          }

          return (
            <Animated.View key={scene.key} style={sceneStyles}>
              <CurrentScene
                navigator={{ push: this.handlePush, pop: this.handlePop }}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  }
};

Navigator.defaultProps = {
  backgroundColor: '#fff',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  scene: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
});
