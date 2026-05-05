import mitt from 'mitt'

interface Events {
  [key: string | symbol]: any
}

const eventBus = mitt<Events>()

export default eventBus
export { eventBus }
