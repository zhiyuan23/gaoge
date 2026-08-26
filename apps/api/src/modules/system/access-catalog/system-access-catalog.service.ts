import { Injectable } from '@nestjs/common'

import { SystemMenuService } from '../menu/system-menu.service'
import { SystemResourceService } from '../resource/system-resource.service'

@Injectable()
export class SystemAccessCatalogService {
  constructor(
    private readonly menus: SystemMenuService,
    private readonly resources: SystemResourceService,
  ) {}

  async getCatalog() {
    const [menus, resources] = await Promise.all([this.menus.findTree(), this.resources.findAll()])
    return { menus, resources }
  }
}
