import team1 from '~/assets/img/team-1.jpg'
import team2 from '~/assets/img/team-2.jpg'
import team3 from '~/assets/img/team-3.jpg'
import team4 from '~/assets/img/team-4.jpg'
import team5 from '~/assets/img/team-5.jpg'
import marie from '~/assets/img/marie.jpg'
import bruceMars from '~/assets/img/bruce-mars.jpg'
import ivanaSquare from '~/assets/img/ivana-square.jpg'
import ivancik from '~/assets/img/ivancik.jpg'
import team9 from '~/assets/img/team-9.jpeg'
import kalVisualsSquare from '~/assets/img/kal-visuals-square.jpg'
import drake from '~/assets/img/drake.jpeg'

export type ShopOrderStatus = 'paid' | 'refunded' | 'canceled'

export interface ShopOrderCustomer {
  name: string
  email: string
  avatar: string
}

export interface ShopOrder {
  id: string
  orderNumber: string
  customer: ShopOrderCustomer
  status: ShopOrderStatus
  createdAt: string
  items: number
  revenue: string
}

export const shopOrders: ShopOrder[] = [
  {
    id: 'ord-1001',
    orderNumber: 'BW-1001',
    customer: { name: 'Nina Costa', email: 'nina.costa@bro.world', avatar: team1 },
    status: 'paid',
    createdAt: '2026-02-14',
    items: 3,
    revenue: '€129.00',
  },
  {
    id: 'ord-1002',
    orderNumber: 'BW-1002',
    customer: { name: 'Liam Bernard', email: 'liam.bernard@bro.world', avatar: team2 },
    status: 'paid',
    createdAt: '2026-02-15',
    items: 1,
    revenue: '€49.00',
  },
  {
    id: 'ord-1003',
    orderNumber: 'BW-1003',
    customer: { name: 'Maya Smith', email: 'maya.smith@bro.world', avatar: team3 },
    status: 'refunded',
    createdAt: '2026-02-16',
    items: 2,
    revenue: '€0.00',
  },
  {
    id: 'ord-1004',
    orderNumber: 'BW-1004',
    customer: { name: 'Noah Martin', email: 'noah.martin@bro.world', avatar: team4 },
    status: 'canceled',
    createdAt: '2026-02-17',
    items: 4,
    revenue: '€0.00',
  },
  {
    id: 'ord-1005',
    orderNumber: 'BW-1005',
    customer: { name: 'Emma Laurent', email: 'emma.laurent@bro.world', avatar: team5 },
    status: 'paid',
    createdAt: '2026-02-18',
    items: 1,
    revenue: '€39.00',
  },
  {
    id: 'ord-1006',
    orderNumber: 'BW-1006',
    customer: { name: 'Alex Kim', email: 'alex.kim@bro.world', avatar: marie },
    status: 'paid',
    createdAt: '2026-02-19',
    items: 5,
    revenue: '€279.00',
  },
  {
    id: 'ord-1007',
    orderNumber: 'BW-1007',
    customer: { name: 'Sofia Ruiz', email: 'sofia.ruiz@bro.world', avatar: bruceMars },
    status: 'refunded',
    createdAt: '2026-02-20',
    items: 2,
    revenue: '€0.00',
  },
  {
    id: 'ord-1008',
    orderNumber: 'BW-1008',
    customer: { name: 'Gabriel Meunier', email: 'gabriel.meunier@bro.world', avatar: ivanaSquare },
    status: 'paid',
    createdAt: '2026-02-20',
    items: 2,
    revenue: '€89.00',
  },
  {
    id: 'ord-1009',
    orderNumber: 'BW-1009',
    customer: { name: 'Chloé Martin', email: 'chloe.martin@bro.world', avatar: ivancik },
    status: 'canceled',
    createdAt: '2026-02-21',
    items: 1,
    revenue: '€0.00',
  },
  {
    id: 'ord-1010',
    orderNumber: 'BW-1010',
    customer: { name: 'Ethan Dubois', email: 'ethan.dubois@bro.world', avatar: team9 },
    status: 'paid',
    createdAt: '2026-02-22',
    items: 6,
    revenue: '€349.00',
  },
  {
    id: 'ord-1011',
    orderNumber: 'BW-1011',
    customer: { name: 'Lea Rossi', email: 'lea.rossi@bro.world', avatar: kalVisualsSquare },
    status: 'paid',
    createdAt: '2026-02-23',
    items: 1,
    revenue: '€59.00',
  },
  {
    id: 'ord-1012',
    orderNumber: 'BW-1012',
    customer: { name: 'Tom Nguyen', email: 'tom.nguyen@bro.world', avatar: drake },
    status: 'refunded',
    createdAt: '2026-02-24',
    items: 3,
    revenue: '€0.00',
  },
]
