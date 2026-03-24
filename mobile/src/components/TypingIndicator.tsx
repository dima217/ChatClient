import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { getUserName } from '../lib/users'
import { colors } from '../theme'

interface Props {
  userIds: string[]
}

export function TypingIndicator({ userIds }: Props) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  if (userIds.length === 0) return null

  const names = userIds.map(id => getUserName(id)).join(', ')

  return (
    <View style={s.container}>
      <View style={s.dots}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={[
              s.dot,
              {
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: i === 1 ? [0.5, 1] : [0.3, 0.7],
                }),
              },
            ]}
          />
        ))}
      </View>
      <Text style={s.text}>{names} {userIds.length === 1 ? 'is' : 'are'} typing</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 32,
  },
  dots: { flexDirection: 'row', gap: 2 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.gray500,
  },
  text: { fontSize: 12, color: colors.text.gray500 },
})
